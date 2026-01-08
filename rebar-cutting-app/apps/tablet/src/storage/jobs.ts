import * as SQLite from 'expo-sqlite';

import type { Job } from '@rebar/core';

const db = SQLite.openDatabase('jobs.db');

export const initializeJobs = () =>
  new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL)',
        );
      },
      (error) => reject(error),
      () => resolve(),
    );
  });

export const saveJob = (job: Job) =>
  new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('INSERT OR REPLACE INTO jobs (id, payload) VALUES (?, ?)', [
          job.id,
          JSON.stringify(job),
        ]);
      },
      (error) => reject(error),
      () => resolve(),
    );
  });

export const loadJobs = () =>
  new Promise<Job[]>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('SELECT payload FROM jobs ORDER BY id', [], (_, result) => {
          const jobs: Job[] = [];
          for (let index = 0; index < result.rows.length; index += 1) {
            const row = result.rows.item(index) as { payload: string };
            jobs.push(JSON.parse(row.payload) as Job);
          }
          resolve(jobs);
        });
      },
      (error) => reject(error),
    );
  });
