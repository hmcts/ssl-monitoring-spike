#!/usr/bin/env node

// TODO possibly re-write to be async
const { execSync } = require('child_process');
const differenceInCalendarDays = require('date-fns/differenceInCalendarDays')

const minValidity = 25

function checkHost(domain, host, port) {
    if (!host) {
        host = domain
    }
    if (!port) {
        port = 443
    }

    const verifyChainCommand = `echo | openssl s_client -connect ${domain}:${port} -servername ${host} 2> /dev/null | grep "Verify return code" | sed  's/^ *//g'`
    const verifyChainStdOut = execSync(verifyChainCommand).toString('utf-8').trim();

    if (verifyChainStdOut !== 'Verify return code: 0 (ok)') {
        console.log(`Cert chain invalid for ${host}, error: ${verifyChainStdOut}`)
    }

    const certValidityCommand = `echo | openssl s_client -connect ${domain}:${port} -servername ${host} 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d '=' -f 2`
    const stdout = execSync(certValidityCommand);

    const dateExpires = stdout.toString("utf8").trim();
    const validityInDaysFromToday = differenceInCalendarDays(new Date(dateExpires), new Date());

    if (validityInDaysFromToday <= minValidity) {
        console.log(`Cert requires renewing for ${host}, expiry date ${dateExpires}, diff from today in days: ${validityInDaysFromToday}`)
    } else {
        console.log(`${host} valid for ${validityInDaysFromToday} more days`)
    }
}

checkHost('www.moneyclaims.service.gov.uk')
// checkHost('self-signed.badssl.com')
// checkHost('expired.badssl.com')
