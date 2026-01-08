import { useEffect, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import type { CutPlan, Job } from '@rebar/core';

import { createCutPlan } from '../domain/cutPlan';
import { initializeJobs, loadJobs, saveJob } from '../storage/jobs';

export const CutPlanScreen = () => {
  const [jobJson, setJobJson] = useState('');
  const [plan, setPlan] = useState<CutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        await initializeJobs();
        const storedJobs = await loadJobs();
        setJobs(storedJobs);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, []);

  const handleGenerate = () => {
    setError(null);
    setPlan(null);
    try {
      const parsed = JSON.parse(jobJson) as Job;
      const generated = createCutPlan(parsed);
      setPlan(generated);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(jobJson) as Job;
      await saveJob(parsed);
      const storedJobs = await loadJobs();
      setJobs(storedJobs);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cut Plan</Text>
      <Text style={styles.body}>
        Generate deterministic cut plans offline using the shared optimizer.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Input (JSON)</Text>
        <TextInput
          style={styles.input}
          value={jobJson}
          onChangeText={setJobJson}
          placeholder="Paste a Job payload to generate a cut plan"
          multiline
        />
        <View style={styles.buttonRow}>
          <Button title="Generate Plan" onPress={handleGenerate} />
          <Button title="Save Job" onPress={handleSave} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored Jobs</Text>
        {isLoading ? (
          <Text style={styles.body}>Loading jobs...</Text>
        ) : jobs.length === 0 ? (
          <Text style={styles.body}>No jobs saved locally.</Text>
        ) : (
          jobs.map((job) => (
            <Text key={job.id} style={styles.body}>
              {job.id} · {job.parts.length} parts · {job.stocks.length} sticks
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generated Plan</Text>
        {plan ? (
          <Text style={styles.body}>{JSON.stringify(plan, null, 2)}</Text>
        ) : (
          <Text style={styles.body}>No plan generated yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '600'
  },
  body: {
    fontSize: 16
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500'
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
  },
  error: {
    color: '#c0392b',
    fontWeight: '600'
  }
});
