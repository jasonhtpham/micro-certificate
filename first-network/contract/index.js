/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const certificateIssuer = require('./lib/certificateIssuer');

module.exports.CertificateIssuer = certificateIssuer;
module.exports.contracts = [certificateIssuer];
