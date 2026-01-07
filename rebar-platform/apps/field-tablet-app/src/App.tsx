/**
 * Field tablet read-only view for projects, shapes, and pallet plans.
 * TODO: Replace CORE_API_URL for device-accessible host names in production.
 */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Project = {
  id: string;
  name: string;
  shopId: string;
};

type Shape = {
  id: string;
  label: string;
  barSize: string;
  finalLengthInches: number;
  quantity: number;
};

type PalletPiece = {
  shapeId: string;
  shapeLabel?: string | null;
  quantity: number;
  totalWeightLbs: number;
};

type PalletLayer = {
  id: string;
  layerIndex: number;
  weightLbs: number;
  pieces: PalletPiece[];
  overhangWarning?: boolean | null;
};

type PalletPlan = {
  id: string;
  name: string;
  totalWeightLbs: number;
  maxWeightLbs: number;
  status: string;
  overhangWarning?: boolean | null;
  layers: PalletLayer[];
};

const CORE_API_URL = 'http://localhost:3000';

type ScreenState =
  | { screen: 'projectList' }
  | { screen: 'projectDetail'; project: Project };

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ screen: 'projectList' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [pallets, setPallets] = useState<PalletPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${CORE_API_URL}/projects`);
        if (!response.ok) {
          throw new Error(`Failed to load projects (${response.status})`);
        }
        const data = (await response.json()) as Project[];
        if (!active) return;
        setProjects(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const loadProjectDetail = async (project: Project) => {
    setLoading(true);
    setError(null);
    try {
      const [shapesResponse, palletResponse] = await Promise.all([
        fetch(`${CORE_API_URL}/projects/${project.id}/shapes`),
        fetch(`${CORE_API_URL}/projects/${project.id}/pallet-plans`),
      ]);
      if (!shapesResponse.ok) {
        throw new Error(`Failed to load shapes (${shapesResponse.status})`);
      }
      if (!palletResponse.ok) {
        throw new Error(`Failed to load pallet plans (${palletResponse.status})`);
      }
      const shapeData = (await shapesResponse.json()) as Shape[];
      const palletData = (await palletResponse.json()) as PalletPlan[];
      setShapes(shapeData);
      setPallets(palletData);
      setScreen({ screen: 'projectDetail', project });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project detail');
    } finally {
      setLoading(false);
    }
  };

  const renderProjectList = () => (
    <View style={styles.panel}>
      <Text style={styles.heading}>Projects</Text>
      {loading && <Text style={styles.copy}>Loading projects…</Text>}
      {error && <Text style={styles.warning}>{error}</Text>}
      {!loading && projects.length === 0 && <Text style={styles.copy}>No projects available.</Text>}
      {projects.map((project) => (
        <TouchableOpacity
          key={project.id}
          style={styles.card}
          onPress={() => loadProjectDetail(project)}
          accessibilityLabel={`Open ${project.name}`}
        >
          <Text style={styles.cardTitle}>{project.name}</Text>
          <Text style={styles.copy}>Project ID: {project.id}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderShape = (shape: Shape) => (
    <View key={shape.id} style={styles.card}>
      <Text style={styles.cardTitle}>{shape.label}</Text>
      <Text style={styles.copy}>
        {shape.barSize} · {shape.finalLengthInches.toFixed(1)}" · Qty {shape.quantity}
      </Text>
    </View>
  );

  const renderPallet = (pallet: PalletPlan) => (
    <View key={pallet.id} style={styles.card}>
      <Text style={styles.cardTitle}>{pallet.name}</Text>
      <Text style={styles.copy}>
        {pallet.totalWeightLbs.toFixed(0)} / {pallet.maxWeightLbs.toFixed(0)} lbs · Status {pallet.status}
      </Text>
      {pallet.overhangWarning && <Text style={styles.warning}>Overhang warning</Text>}
      {pallet.layers.map((layer) => (
        <View key={layer.id} style={styles.layerRow}>
          <Text style={styles.copy}>
            Layer {layer.layerIndex} · {layer.weightLbs.toFixed(0)} lbs
          </Text>
          {layer.overhangWarning && <Text style={styles.warning}>Overhang</Text>}
          {layer.pieces.map((piece) => (
            <Text key={piece.shapeId} style={styles.copy}>
              {piece.quantity} × {piece.shapeLabel ?? piece.shapeId} ({piece.totalWeightLbs.toFixed(0)} lbs)
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  const renderProjectDetail = (project: Project) => (
    <View style={styles.panel}>
      <Text style={styles.heading}>{project.name}</Text>
      {loading && <Text style={styles.copy}>Loading project data…</Text>}
      {error && <Text style={styles.warning}>{error}</Text>}

      <Text style={styles.sectionHeading}>Shapes</Text>
      {!loading && shapes.length === 0 && <Text style={styles.copy}>No shapes found.</Text>}
      {shapes.map(renderShape)}

      <Text style={styles.sectionHeading}>Pallet plans</Text>
      {!loading && pallets.length === 0 && <Text style={styles.copy}>No pallet plans available.</Text>}
      {pallets.map(renderPallet)}

      <TouchableOpacity style={styles.backButton} onPress={() => setScreen({ screen: 'projectList' })}>
        <Text style={styles.backButtonText}>Back to projects</Text>
      </TouchableOpacity>
    </View>
  );

  let content: JSX.Element;
  if (screen.screen === 'projectList') {
    content = renderProjectList();
  } else {
    content = renderProjectDetail(screen.project);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>{content}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  panel: {
    marginVertical: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  copy: {
    fontSize: 14,
    marginBottom: 6,
  },
  warning: {
    color: '#b45309',
    fontWeight: '700',
  },
  layerRow: {
    marginTop: 8,
    paddingLeft: 8,
  },
  backButton: {
    backgroundColor: '#111827',
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
