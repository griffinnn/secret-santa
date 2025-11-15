#!/usr/bin/env node
import JSONDatabase from '../database-json.js';
import SQLiteDatabase from '../database-sqlite.js';

function parseFlags(args) {
  return args.reduce((acc, arg) => {
    if (arg.startsWith('--')) {
      const [rawKey, rawValue] = arg.slice(2).split('=');
      const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[key] = rawValue === undefined ? true : rawValue;
    } else {
      acc._.push(arg);
    }
    return acc;
  }, { _: [] });
}

function getSummaryLabel(count, label) {
  return `${count} ${label}${count === 1 ? '' : 's'}`;
}

function toBoolean(value) {
  if (value === undefined) return false;
  if (value === true) return true;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
}

async function loadJsonDatabase() {
  const jsonDb = new JSONDatabase();
  await jsonDb.initialize();
  return jsonDb;
}

async function createSQLite() {
  const sqlite = new SQLiteDatabase();
  await sqlite.initialize();
  return sqlite;
}

async function clearSqliteTables(sqlite) {
  const tables = ['assignments', 'pending_participants', 'participants', 'exchanges', 'users'];
  for (const table of tables) {
    await sqlite.query(`DELETE FROM ${table}`);
  }
}

async function exportToSQLite(flags) {
  const jsonDb = await loadJsonDatabase();
  const sqlite = await createSQLite();
  const preserve = toBoolean(flags.preserve);
  const {
    users = [],
    exchanges = [],
    participants = [],
    pendingParticipants = [],
    assignments = []
  } = jsonDb.data;

  const stats = {
    users: 0,
    exchanges: 0,
    participants: 0,
    pendingParticipants: 0,
    assignments: 0
  };

  try {
    if (!preserve) {
      await clearSqliteTables(sqlite);
    }

    for (const user of users) {
      await sqlite.query(
        `INSERT INTO users (id, name, email, role, wish_list, gift_hints, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           role = excluded.role,
           wish_list = excluded.wish_list,
           gift_hints = excluded.gift_hints,
           created_at = excluded.created_at`,
        [
          user.id,
          user.name,
          user.email,
          user.role || 'user',
          user.wishList || '',
          user.giftHints || '',
          user.createdAt || new Date().toISOString()
        ]
      );
      stats.users++;
    }

    for (const exchange of exchanges) {
      await sqlite.query(
        `INSERT INTO exchanges (id, name, gift_budget, created_by, start_date, end_date, status, assignments_generated, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           gift_budget = excluded.gift_budget,
           created_by = excluded.created_by,
           start_date = excluded.start_date,
           end_date = excluded.end_date,
           status = excluded.status,
           assignments_generated = excluded.assignments_generated,
           created_at = excluded.created_at`,
        [
          exchange.id,
          exchange.name,
          exchange.giftBudget,
          exchange.createdBy,
          exchange.startDate || null,
          exchange.endDate || null,
          exchange.status || 'active',
          exchange.assignmentsGenerated ? 1 : 0,
          exchange.createdAt || new Date().toISOString()
        ]
      );
      stats.exchanges++;
    }

    for (const participant of participants) {
      await sqlite.query(
        `INSERT OR REPLACE INTO participants (id, exchange_id, user_id, joined_at)
         VALUES ($1, $2, $3, $4)`,
        [
          participant.id,
          participant.exchangeId,
          participant.userId,
          participant.joinedAt || new Date().toISOString()
        ]
      );
      stats.participants++;
    }

    for (const pending of pendingParticipants) {
      await sqlite.query(
        `INSERT OR REPLACE INTO pending_participants (id, exchange_id, user_id, requested_at)
         VALUES ($1, $2, $3, $4)`,
        [
          pending.id,
          pending.exchangeId,
          pending.userId,
          pending.requestedAt || new Date().toISOString()
        ]
      );
      stats.pendingParticipants++;
    }

    for (const assignment of assignments) {
      await sqlite.query(
        `INSERT OR REPLACE INTO assignments (id, exchange_id, giver_id, recipient_id, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assignment.id,
          assignment.exchangeId,
          assignment.giverId,
          assignment.recipientId,
          assignment.createdAt || new Date().toISOString()
        ]
      );
      stats.assignments++;
    }

    console.log('Export complete.');
    console.log(`- ${getSummaryLabel(stats.users, 'user')}`);
    console.log(`- ${getSummaryLabel(stats.exchanges, 'exchange')}`);
    console.log(`- ${getSummaryLabel(stats.participants, 'participant')}`);
    console.log(`- ${getSummaryLabel(stats.pendingParticipants, 'pending participant')}`);
    console.log(`- ${getSummaryLabel(stats.assignments, 'assignment')}`);
  } finally {
    await sqlite.close();
  }
}

function buildIdSet(rows, key = 'id') {
  return new Set(rows.map(row => row[key]));
}

async function fetchSqliteTable(sqlite, table) {
  const result = await sqlite.query(`SELECT * FROM ${table}`);
  return result.rows;
}

function validateJsonRelations(jsonData) {
  const issues = [];
  const userIds = new Set(jsonData.users.map(u => u.id));
  const exchangeIds = new Set(jsonData.exchanges.map(e => e.id));

  for (const participant of jsonData.participants) {
    if (!userIds.has(participant.userId)) {
      issues.push(`Participant ${participant.id} references missing user ${participant.userId}`);
    }
    if (!exchangeIds.has(participant.exchangeId)) {
      issues.push(`Participant ${participant.id} references missing exchange ${participant.exchangeId}`);
    }
  }

  for (const pending of jsonData.pendingParticipants) {
    if (!userIds.has(pending.userId)) {
      issues.push(`Pending participant ${pending.id} references missing user ${pending.userId}`);
    }
    if (!exchangeIds.has(pending.exchangeId)) {
      issues.push(`Pending participant ${pending.id} references missing exchange ${pending.exchangeId}`);
    }
  }

  for (const assignment of jsonData.assignments) {
    if (!userIds.has(assignment.giverId)) {
      issues.push(`Assignment ${assignment.id} references missing giver ${assignment.giverId}`);
    }
    if (!userIds.has(assignment.recipientId)) {
      issues.push(`Assignment ${assignment.id} references missing recipient ${assignment.recipientId}`);
    }
    if (!exchangeIds.has(assignment.exchangeId)) {
      issues.push(`Assignment ${assignment.id} references missing exchange ${assignment.exchangeId}`);
    }
  }

  return issues;
}

async function checkIntegrity() {
  const jsonDb = await loadJsonDatabase();
  const sqlite = await createSQLite();
  const {
    users = [],
    exchanges = [],
    participants = [],
    pendingParticipants = [],
    assignments = []
  } = jsonDb.data;
  try {
    const jsonCounts = {
      users: users.length,
      exchanges: exchanges.length,
      participants: participants.length,
      pendingParticipants: pendingParticipants.length,
      assignments: assignments.length
    };

    const sqliteTables = {
      users: await fetchSqliteTable(sqlite, 'users'),
      exchanges: await fetchSqliteTable(sqlite, 'exchanges'),
      participants: await fetchSqliteTable(sqlite, 'participants'),
      pendingParticipants: await fetchSqliteTable(sqlite, 'pending_participants'),
      assignments: await fetchSqliteTable(sqlite, 'assignments')
    };

    const sqliteCounts = Object.fromEntries(
      Object.entries(sqliteTables).map(([key, rows]) => [key, rows.length])
    );

    console.log('JSON counts:', jsonCounts);
    console.log('SQLite counts:', sqliteCounts);

    let hasMismatch = false;
    for (const key of Object.keys(jsonCounts)) {
      if (jsonCounts[key] !== sqliteCounts[key]) {
        hasMismatch = true;
        console.error(`ERROR: Count mismatch for ${key}: JSON=${jsonCounts[key]} SQLite=${sqliteCounts[key]}`);
      }
    }

    const jsonIssues = validateJsonRelations({
      users,
      exchanges,
      participants,
      pendingParticipants,
      assignments
    });
    if (jsonIssues.length > 0) {
      hasMismatch = true;
      console.error('ERROR: JSON integrity issues detected:');
      jsonIssues.forEach(issue => console.error(`  - ${issue}`));
    } else {
      console.log('JSON relationships look consistent.');
    }

    const jsonIds = {
      users: buildIdSet(users),
      exchanges: buildIdSet(exchanges),
      participants: buildIdSet(participants),
      pendingParticipants: buildIdSet(pendingParticipants),
      assignments: buildIdSet(assignments)
    };

    const sqliteIds = {
      users: buildIdSet(sqliteTables.users),
      exchanges: buildIdSet(sqliteTables.exchanges),
      participants: buildIdSet(sqliteTables.participants),
      pendingParticipants: buildIdSet(sqliteTables.pendingParticipants),
      assignments: buildIdSet(sqliteTables.assignments)
    };

    for (const key of Object.keys(jsonIds)) {
      for (const id of jsonIds[key]) {
        if (!sqliteIds[key].has(id)) {
          hasMismatch = true;
          console.error(`ERROR: Missing in SQLite ${key}: ${id}`);
        }
      }
      for (const id of sqliteIds[key]) {
        if (!jsonIds[key].has(id)) {
          hasMismatch = true;
          console.error(`ERROR: Extra in SQLite ${key}: ${id}`);
        }
      }
    }

    if (!hasMismatch) {
      console.log('SQLite data matches JSON source.');
    } else {
      process.exitCode = 1;
    }
  } finally {
    await sqlite.close();
  }
}

async function syncAssignments(flags) {
  const dryRun = toBoolean(flags.dryRun);
  const jsonDb = await loadJsonDatabase();
  const sqlite = await createSQLite();
  const {
    assignments = [],
    exchanges = []
  } = jsonDb.data;

  const inserted = [];
  const updated = [];
  const skipped = [];

  try {
    const existingAssignments = await fetchSqliteTable(sqlite, 'assignments');
    const existingMap = new Map(existingAssignments.map(row => [row.id, row]));
    const jsonAssignmentIds = new Set(assignments.map(a => a.id));

    for (const assignment of assignments) {
      const currentRow = existingMap.get(assignment.id);
      if (!currentRow) {
        inserted.push(assignment.id);
        if (!dryRun) {
          await sqlite.query(
            `INSERT INTO assignments (id, exchange_id, giver_id, recipient_id, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              assignment.id,
              assignment.exchangeId,
              assignment.giverId,
              assignment.recipientId,
              assignment.createdAt || new Date().toISOString()
            ]
          );
        }
        continue;
      }

      const needsUpdate =
        currentRow.exchange_id !== assignment.exchangeId ||
        currentRow.giver_id !== assignment.giverId ||
        currentRow.recipient_id !== assignment.recipientId;

      if (needsUpdate) {
        updated.push(assignment.id);
        if (!dryRun) {
          await sqlite.query(
            `UPDATE assignments
             SET exchange_id = $1,
                 giver_id = $2,
                 recipient_id = $3,
                 created_at = $4
             WHERE id = $5`,
            [
              assignment.exchangeId,
              assignment.giverId,
              assignment.recipientId,
              assignment.createdAt || new Date().toISOString(),
              assignment.id
            ]
          );
        }
      } else {
        skipped.push(assignment.id);
      }
    }

    const strayAssignments = existingAssignments
      .map(row => row.id)
      .filter(id => !jsonAssignmentIds.has(id));

    let flagUpdates = 0;
    for (const exchange of exchanges) {
      const desired = exchange.assignmentsGenerated ? 1 : 0;
      const current = await sqlite.query('SELECT assignments_generated FROM exchanges WHERE id = $1', [exchange.id]);
      const existingValue = current.rows[0]?.assignments_generated;
      if (existingValue !== undefined && existingValue !== desired) {
        flagUpdates++;
        if (!dryRun) {
          await sqlite.query(
            'UPDATE exchanges SET assignments_generated = $1 WHERE id = $2',
            [desired, exchange.id]
          );
        }
      }
    }

    console.log('Assignment sync summary:');
    console.log(`- inserted: ${inserted.length}`);
    console.log(`- updated: ${updated.length}`);
    console.log(`- skipped (already matching): ${skipped.length}`);
    console.log(`- stray in SQLite: ${strayAssignments.length}`);
    console.log(`- exchanges updated for assignment flags: ${flagUpdates}`);

    if (strayAssignments.length > 0) {
      console.warn('WARNING: Assignments present in SQLite but missing from JSON:', strayAssignments.join(', '));
      process.exitCode = 1;
    }
  } finally {
    await sqlite.close();
  }
}

function printUsage() {
  console.log('Secret Santa database migration CLI');
  console.log('Usage: node tools/migrate-data.js <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  export           Export JSON data to SQLite.');
  console.log('    --preserve     Merge into existing SQLite data instead of cleaning tables first.');
  console.log('');
  console.log('  check            Validate JSON data and compare with SQLite snapshot.');
  console.log('');
  console.log('  sync-assignments Sync assignments table and exchange flags from JSON to SQLite.');
  console.log('    --dry-run      Show the planned changes without writing them.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
    return;
  }

  const [command, ...rest] = args;
  const flags = parseFlags(rest);

  try {
    switch (command) {
      case 'export':
        await exportToSQLite(flags);
        break;
      case 'check':
        await checkIntegrity();
        break;
      case 'sync-assignments':
        await syncAssignments(flags);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exitCode = 1;
    }
  } catch (error) {
    console.error('ERROR: Command failed:', error.message);
    process.exitCode = 1;
  }
}

main();
