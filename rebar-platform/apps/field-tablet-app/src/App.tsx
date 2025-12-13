/**
 * Field tablet scaffolding for pallet planning and stacking instructions.
 * Refer to docs/product/pallet_planning.md for the workflow this UI mirrors.
 */
import React, { useMemo, useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PalletStatus = 'planned' | 'stacking' | 'stacked' | 'loaded';

type PalletPiece = {
  shapeId: string;
  shapeLabel: string;
  quantity: number;
  weightPerPieceLbs: number;
  totalWeightLbs: number;
};

type PalletLayer = {
  layerIndex: number;
  weightLbs: number;
  pieces: PalletPiece[];
  overhangWarning?: boolean;
};

type PalletPlan = {
  id: string;
  name: string;
  totalWeightLbs: number;
  maxWeightLbs: number;
  status: PalletStatus;
  overhangWarning?: boolean;
  layers: PalletLayer[];
};

type Project = {
  id: string;
  name: string;
};

const sampleProject: Project = {
  id: 'project-1',
  name: 'Highway Overpass Retrofit',
};

type ProductionRunSummary = {
  id: string;
  name: string;
  operatorLabel: string;
  scrapLengthIn: number;
  stockUsedIn: number;
  scrapPercent: number;
  scrapFreeThresholdPercent: number;
  isScrapFree: boolean;
};

const mockRuns: ProductionRunSummary[] = [
  {
    id: 'run-1',
    name: 'Cutter Run 1',
    operatorLabel: 'Alex (Operator A)',
    scrapLengthIn: 18,
    stockUsedIn: 1200,
    scrapPercent: 1.5,
    scrapFreeThresholdPercent: 2,
    isScrapFree: true,
  },
  {
    id: 'run-2',
    name: 'Cutter Run 2',
    operatorLabel: 'Blake (Operator B)',
    scrapLengthIn: 24,
    stockUsedIn: 800,
    scrapPercent: 3,
    scrapFreeThresholdPercent: 2,
    isScrapFree: false,
  },
];

const mockedPallets: PalletPlan[] = [
  {
    id: 'pallet-1',
    name: 'Pallet 1',
    totalWeightLbs: 2480,
    maxWeightLbs: 3200,
    status: 'planned',
    overhangWarning: false,
    layers: [
      {
        layerIndex: 1,
        weightLbs: 900,
        pieces: [
          { shapeId: 'A21', shapeLabel: 'A21 #6 18ft', quantity: 12, weightPerPieceLbs: 75, totalWeightLbs: 900 },
        ],
      },
      {
        layerIndex: 2,
        weightLbs: 820,
        pieces: [
          { shapeId: 'B15', shapeLabel: 'B15 #4 12ft', quantity: 20, weightPerPieceLbs: 41, totalWeightLbs: 820 },
        ],
      },
      {
        layerIndex: 3,
        weightLbs: 760,
        pieces: [
          { shapeId: 'C05', shapeLabel: 'C05 #8 6ft', quantity: 30, weightPerPieceLbs: 25, totalWeightLbs: 760 },
        ],
      },
    ],
  },
  {
    id: 'pallet-2',
    name: 'Pallet 2',
    totalWeightLbs: 2950,
    maxWeightLbs: 3200,
    status: 'planned',
    overhangWarning: true,
    layers: [
      {
        layerIndex: 1,
        weightLbs: 1200,
        overhangWarning: true,
        pieces: [
          { shapeId: 'D10', shapeLabel: 'D10 #8 30ft', quantity: 10, weightPerPieceLbs: 120, totalWeightLbs: 1200 },
        ],
      },
      {
        layerIndex: 2,
        weightLbs: 980,
        pieces: [
          { shapeId: 'E11', shapeLabel: 'E11 #5 14ft', quantity: 16, weightPerPieceLbs: 61, totalWeightLbs: 980 },
        ],
      },
      {
        layerIndex: 3,
        weightLbs: 770,
        pieces: [
          { shapeId: 'F04', shapeLabel: 'F04 #4 10ft', quantity: 18, weightPerPieceLbs: 43, totalWeightLbs: 770 },
        ],
      },
    ],
  },
];

type ScreenState =
  | { screen: 'projectList' }
  | { screen: 'projectDetail'; project: Project }
  | { screen: 'palletList'; project: Project }
  | { screen: 'palletDetail'; project: Project; pallet: PalletPlan };

export default function App() {
  const [pallets, setPallets] = useState<PalletPlan[]>([]);
  const [screen, setScreen] = useState<ScreenState>({ screen: 'projectList' });
  const [runs] = useState<ProductionRunSummary[]>(mockRuns);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [queuedStatuses, setQueuedStatuses] = useState<string[]>([]);

  const hasPlans = pallets.length > 0;
  const cachedTime = useMemo(() => (lastSynced ? lastSynced.toLocaleTimeString() : 'not synced'), [lastSynced]);

  const updateStatus = (palletId: string, status: PalletStatus) => {
    setPallets((existing) =>
      existing.map((pallet) => (pallet.id === palletId ? { ...pallet, status } : pallet)),
    );
    setQueuedStatuses((queue) => [...queue, `${palletId}:${status}`]);
    setLastSynced(new Date());
  };

  const handleGenerate = () => {
    setPallets(mockedPallets);
    setLastSynced(new Date());
    setQueuedStatuses([]);
    setScreen({ screen: 'palletList', project: sampleProject });
  };

  const renderProjectList = () => (
    <View style={styles.panel}>
      <Text style={styles.heading}>Projects</Text>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setScreen({ screen: 'projectDetail', project: sampleProject })}
        accessibilityLabel="Open project details"
      >
        <Text style={styles.cardTitle}>{sampleProject.name}</Text>
        <Text style={styles.copy}>Job sheets parsed. Cutter and bender workflows ready.</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProjectDetail = (project: Project) => (
    <View style={styles.panel}>
      <Text style={styles.heading}>{project.name}</Text>
      <Text style={styles.copy}>Actions</Text>
      <Button title="View job sheet" onPress={() => {}} />
      <Button title="View cutter plan" onPress={() => {}} />
      <Button title="View bender plan" onPress={() => {}} />
      <Button title="Pallet plans" onPress={() => setScreen({ screen: 'palletList', project })} />

      <Text style={styles.heading}>Recent cutter runs</Text>
      <Text style={styles.copy}>Scrap-free is read-only from shop settings; operators see status only.</Text>
      {runs.map((run) => renderRunCard(run))}
    </View>
  );

  const renderScrapBadge = (run: ProductionRunSummary) => (
    <Text style={[styles.tag, run.isScrapFree ? styles.tagSuccess : styles.tagMuted]}>
      {run.isScrapFree ? 'SCRAP-FREE' : 'SCRAP TRACKED'}
    </Text>
  );

  const renderRunCard = (run: ProductionRunSummary) => (
    <View key={run.id} style={styles.card}>
      <View style={styles.tagRow}>
        <Text style={styles.cardTitle}>{run.name}</Text>
        {renderScrapBadge(run)}
      </View>
      <Text style={styles.copy}>Operator: {run.operatorLabel}</Text>
      {run.isScrapFree ? (
        <Text style={styles.positive}>
          Scrap-free target hit (scrap ≤ {run.scrapFreeThresholdPercent.toFixed(1)}%).
        </Text>
      ) : (
        <Text style={styles.warning}>Scrap-free target missed (scrap = {run.scrapPercent.toFixed(1)}%).</Text>
      )}
      <Text style={styles.copy}>
        Scrap captured: {run.scrapLengthIn.toFixed(1)} in from {run.stockUsedIn.toFixed(0)} in stock used.
      </Text>
      <Text style={styles.copy}>Threshold set by shop settings; adjust in admin tools only.</Text>
    </View>
  );

  const renderPalletCard = (pallet: PalletPlan) => {
    const nearLimit = pallet.totalWeightLbs > 0.9 * pallet.maxWeightLbs;
    return (
      <TouchableOpacity
        key={pallet.id}
        style={styles.card}
        onPress={() => setScreen({ screen: 'palletDetail', project: sampleProject, pallet })}
      >
        <Text style={styles.cardTitle}>
          {pallet.name} – {pallet.totalWeightLbs.toFixed(0)} lbs
        </Text>
        <Text style={styles.copy}>
          {pallet.layers.length} layers · Max {pallet.maxWeightLbs} lbs · Status: {pallet.status}
        </Text>
        {pallet.overhangWarning && <Text style={styles.warning}>Watch overhang</Text>}
        {nearLimit && <Text style={styles.warning}>Near lift limit</Text>}
      </TouchableOpacity>
    );
  };

  const renderPalletList = (project: Project) => (
    <View style={styles.panel}>
      <Text style={styles.heading}>Pallet plans for {project.name}</Text>
      <Text style={styles.copy}>Last synced: {cachedTime}</Text>
      {!hasPlans && (
        <View style={styles.card}>
          <Text style={styles.copy}>No pallet plan yet.</Text>
          <Button title="Generate pallet plan" onPress={handleGenerate} />
        </View>
      )}
      {hasPlans && pallets.map((pallet) => renderPalletCard(pallet))}
      <Button title="Back to project" onPress={() => setScreen({ screen: 'projectDetail', project })} />
    </View>
  );

  const renderDiagram = (layer: PalletLayer) => (
    <View key={layer.layerIndex} style={styles.diagramLayer}>
      {layer.pieces.map((piece) => (
        <View key={piece.shapeId} style={styles.diagramBlock}>
          <Text style={styles.diagramText}>
            {piece.shapeId} × {piece.quantity}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPalletDetail = (project: Project, pallet: PalletPlan) => (
    <View style={styles.panel}>
      <Text style={styles.heading}>{pallet.name}</Text>
      <Text style={styles.copy}>
        Total {pallet.totalWeightLbs.toFixed(0)} lbs / Max {pallet.maxWeightLbs} lbs · Status {pallet.status}
      </Text>
      {pallet.overhangWarning && <Text style={styles.warning}>Watch overhang on the longest bars</Text>}
      <Text style={styles.copy}>Offline cache queued updates: {queuedStatuses.length}</Text>
      <Text style={styles.copy}>Last synced: {cachedTime}</Text>

      {pallet.layers.map((layer) => (
        <View key={layer.layerIndex} style={styles.card}>
          <Text style={styles.cardTitle}>
            Layer {layer.layerIndex} – {layer.weightLbs.toFixed(0)} lbs
          </Text>
          {layer.overhangWarning && <Text style={styles.warning}>Overhang warning</Text>}
          {layer.pieces.map((piece) => (
            <Text key={piece.shapeId} style={styles.copy}>
              {piece.quantity} × {piece.shapeLabel} – {piece.totalWeightLbs.toFixed(0)} lbs
            </Text>
          ))}
          <Text style={styles.copy}>Top-down sketch</Text>
          {renderDiagram(layer)}
        </View>
      ))}

      <View style={styles.buttonRow}>
        <Button title="Start stacking" onPress={() => updateStatus(pallet.id, 'stacking')} />
        <Button title="Mark stacked" onPress={() => updateStatus(pallet.id, 'stacked')} />
        <Button title="Mark loaded" onPress={() => updateStatus(pallet.id, 'loaded')} />
      </View>
      <Button title="Back to pallets" onPress={() => setScreen({ screen: 'palletList', project })} />
    </View>
  );

  let content: JSX.Element;
  switch (screen.screen) {
    case 'projectList':
      content = renderProjectList();
      break;
    case 'projectDetail':
      content = renderProjectDetail(screen.project);
      break;
    case 'palletList':
      content = renderPalletList(screen.project);
      break;
    case 'palletDetail':
      content = renderPalletDetail(screen.project, screen.pallet);
      break;
    default:
      content = renderProjectList();
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
  positive: {
    color: '#047857',
    fontWeight: '700',
  },
  diagramLayer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  diagramBlock: {
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  diagramText: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    overflow: 'hidden',
  },
  tagSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontWeight: '700',
  },
  tagMuted: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    fontWeight: '700',
  },
});
