import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noUnsafePackageImports } from './no-unsafe-package-imports.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-unsafe-package-imports', () => {
  ruleTester.run('no-unsafe-package-imports', noUnsafePackageImports, {
    valid: [
      // Temporal SDK imports
      `import { proxyActivities } from '@temporalio/workflow';`,
      `import { log } from '@temporalio/workflow';`,
      `import { ApplicationFailure } from '@temporalio/common';`,

      // Safe packages
      `import { z } from 'zod';`,
      `import { match } from 'ts-pattern';`,

      // Relative imports
      `import { helper } from './utilities';`,
      `import { types } from '../shared/types';`,

      // Explicitly allowed packages
      {
        code: `import _ from 'lodash';`,
        options: [{ allowImports: ['lodash'] }],
      },
      {
        code: `import { format } from 'date-fns';`,
        options: [{ allowImports: ['date-fns'] }],
      },

      // Default safe packages (allowlist)
      `import { pipe } from 'remeda';`,
      `import _ from 'lodash-es';`,
    ],
    invalid: [
      // UUID packages
      {
        code: `import { v4 } from 'uuid';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import { nanoid } from 'nanoid';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import cuid from 'cuid';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Date/time packages
      {
        code: `import moment from 'moment';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import dayjs from 'dayjs';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // HTTP packages
      {
        code: `import axios from 'axios';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import fetch from 'node-fetch';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import got from 'got';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Filesystem packages
      {
        code: `import fs from 'fs-extra';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import { glob } from 'glob';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Database packages
      {
        code: `import { Client } from 'pg';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import mongoose from 'mongoose';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import { PrismaClient } from '@prisma/client';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Environment packages
      {
        code: `import 'dotenv/config';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Logging packages
      {
        code: `import winston from 'winston';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
      {
        code: `import pino from 'pino';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Utility packages
      {
        code: `import _ from 'lodash';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Custom deny list
      {
        code: `import myBadLib from 'my-bad-lib';`,
        options: [{ denyImports: ['my-bad-lib'] }],
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Dynamic imports
      {
        code: `const axios = await import('axios');`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },

      // Subpath imports
      {
        code: `import { format } from 'date-fns/format';`,
        errors: [{ messageId: 'unsafePackageImport' }],
      },
    ],
  });
});
