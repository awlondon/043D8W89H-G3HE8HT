import { randomUUID } from 'crypto';
import { Pallet, PalletLayer, PalletPiece, PalletStatus, PlannedPalletDto, Project, Shape, ShopPalletConfig } from './models';

const projects: Project[] = [
  { id: 'project-1', name: 'Highway Overpass Retrofit', shopId: 'shop-1' },
];

const shapes: Shape[] = [
  {
    id: 'shape-1',
    projectId: 'project-1',
    label: 'A21',
    barSize: '#6',
    finalLengthInches: 216,
    quantity: 12,
    maxLengthInches: 216,
    shapeType: 'straight',
  },
  {
    id: 'shape-2',
    projectId: 'project-1',
    label: 'B15',
    barSize: '#4',
    finalLengthInches: 144,
    quantity: 20,
    maxLengthInches: 144,
    shapeType: 'stirrup',
  },
  {
    id: 'shape-3',
    projectId: 'project-1',
    label: 'C05',
    barSize: '#8',
    finalLengthInches: 72,
    quantity: 30,
    maxLengthInches: 72,
    shapeType: 'hook',
  },
];

const shopConfigs: ShopPalletConfig[] = [
  {
    shopId: 'shop-1',
    defaultMaxPalletWeightLbs: 3200,
    palletLengthIn: 96,
    palletWidthIn: 48,
    allowOverhangIn: 12,
  },
];

let pallets: Pallet[] = [];
let palletLayers: PalletLayer[] = [];
let palletPieces: PalletPiece[] = [];

export function getProject(projectId: string): Project | undefined {
  return projects.find((project) => project.id === projectId);
}

export function getShopConfigForProject(projectId: string): ShopPalletConfig | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  return shopConfigs.find((config) => config.shopId === project.shopId);
}

export function getShapesForProject(projectId: string, shapeIds?: string[]): Shape[] {
  const scoped = shapes.filter((shape) => shape.projectId === projectId);
  if (!shapeIds || shapeIds.length === 0) return scoped;
  return scoped.filter((shape) => shapeIds.includes(shape.id));
}

export function clearPalletsForProject(projectId: string) {
  pallets = pallets.filter((pallet) => pallet.projectId !== projectId);
  const palletIds = new Set(pallets.map((pallet) => pallet.id));
  palletLayers = palletLayers.filter((layer) => palletIds.has(layer.palletId));
  const layerIds = new Set(palletLayers.map((layer) => layer.id));
  palletPieces = palletPieces.filter((piece) => layerIds.has(piece.palletLayerId));
}

export function createPallet(input: Omit<Pallet, 'createdAt' | 'updatedAt' | 'id'>): Pallet {
  const now = new Date();
  const pallet: Pallet = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  pallets.push(pallet);
  return pallet;
}

export function createLayer(input: Omit<PalletLayer, 'id'>): PalletLayer {
  const layer: PalletLayer = { ...input, id: randomUUID() };
  palletLayers.push(layer);
  return layer;
}

export function createPiece(input: Omit<PalletPiece, 'id'>): PalletPiece {
  const piece: PalletPiece = { ...input, id: randomUUID() };
  palletPieces.push(piece);
  return piece;
}

export function updatePalletStatus(palletId: string, status: PalletStatus): Pallet | undefined {
  const target = pallets.find((pallet) => pallet.id === palletId);
  if (!target) return undefined;
  target.status = status;
  target.updatedAt = new Date();
  return target;
}

export function listPalletsForProject(projectId: string): PlannedPalletDto[] {
  return pallets
    .filter((pallet) => pallet.projectId === projectId)
    .map((pallet) => {
      const layers = palletLayers
        .filter((layer) => layer.palletId === pallet.id)
        .sort((a, b) => a.layerIndex - b.layerIndex)
        .map((layer) => ({
          ...layer,
          pieces: palletPieces.filter((piece) => piece.palletLayerId === layer.id),
        }));
      return { ...pallet, layers };
    });
}

export function getPalletWithLayers(palletId: string): PlannedPalletDto | undefined {
  const pallet = pallets.find((p) => p.id === palletId);
  if (!pallet) return undefined;
  const layers = palletLayers
    .filter((layer) => layer.palletId === pallet.id)
    .sort((a, b) => a.layerIndex - b.layerIndex)
    .map((layer) => ({
      ...layer,
      pieces: palletPieces.filter((piece) => piece.palletLayerId === layer.id),
    }));
  return { ...pallet, layers };
}

export function resetAllPallets() {
  pallets = [];
  palletLayers = [];
  palletPieces = [];
}

export function getInventorySnapshot() {
  return { projects, shapes, pallets, palletLayers, palletPieces, shopConfigs };
}
