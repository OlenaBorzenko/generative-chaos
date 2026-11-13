import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultConfig : Config = {
  p: 3,
  q: 8,
  ringDetail: 20,
  pathDetail: 400,
  tubeRadius: 0.15,
  knotRadius: 0.85,
  waveAmplitude: 0.45,
  eccentricity: 0.6,
  twistTurns: 20,
  globalTwistTurns: 16.5,
  twistDirection: -1,
  lumps: 10,
  lumpHeight: 0.9,
  lumpOffset: 0.0,
  enableElectricity: false,
  electricityStrength: 0.15,
  electricityFreq: 2,
  bgColor: "rgb(15, 25, 45)",
  fillColor: "rgba(223, 103, 48, 0.75)",
  wireColor: "rgb(255, 255, 255)"
};

export type Config = {
  p: number;
  q: number;
  ringDetail: number;
  pathDetail: number;
  tubeRadius: number;
  knotRadius: number;
  waveAmplitude: number;
  eccentricity: number;
  twistTurns: number;
  globalTwistTurns: number;
  twistDirection: number;
  lumps: number;
  lumpHeight: number;
  lumpOffset: number;
  enableElectricity: boolean;
  electricityStrength: number;
  electricityFreq: number;
  bgColor: string;
  fillColor: string;
  wireColor: string;
};

export type DesignConfig = {
  id: string;
  previewUrl: string;
  userInput: string;
  description?: string | null;
  torusConfig: Config;
  fusedFrom?: string[];
};

export type FusionRequest = {
  newDesignId: string;
  similarDesignIds: string[];
  guidance?: string | null;
};

type StoreState = {
  similarDesigns: DesignConfig[];
  newDesign: DesignConfig;
  selectedDesign: DesignConfig;
  fusedDesign?: DesignConfig | null;
  fusionSelection?: string[];
  isFusing: boolean;
  fusionError: string | null;
  generationError: string | null;
  similarityError: string | null;
  isSearchingSimilar: boolean;
  setSimilarDesigns: (designs: DesignConfig[]) => void;
  setSelectedDesign: (design: DesignConfig) => void;
  removeDeletedDesign: (id: string) => void;
  setNewDesign: (design: DesignConfig) => void;
  toggleFusionSelection: (id: string) => void;
  resetFusion: () => void;
  fuseDesigns: (guidance?: string) => Promise<void>;
  clearState: () => void;
  updateDesignConfig: (design: DesignConfig) => Promise<void>;
  fetchAndSetDesigns: (input: string) => Promise<void>;
};

let fusionRequestId = 0;
let generationRequestId = 0;
const deletedDesignIds = new Set<string>();

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? `Request failed (${response.status}).`);
  }
  return data as T;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      similarDesigns: [],
      newDesign: {
        id: '',
        previewUrl: '',
        torusConfig: defaultConfig,
      } as DesignConfig,
      selectedDesign: {} as DesignConfig,
      fusedDesign: null,
      fusionSelection: [],
      isFusing: false,
      fusionError: null,
      generationError: null,
      similarityError: null,
      isSearchingSimilar: false,
      setSelectedDesign: (design: DesignConfig) => set({ selectedDesign: design }),
      removeDeletedDesign: (id) => {
        deletedDesignIds.add(id);
        const state = get();
        const affectsFusion = state.newDesign.id === id || (state.fusionSelection ?? []).includes(id);
        if (affectsFusion) fusionRequestId += 1;
        set({
          similarDesigns: state.similarDesigns.filter((design) => design.id !== id),
          selectedDesign: state.selectedDesign.id === id ? {} as DesignConfig : state.selectedDesign,
          newDesign: state.newDesign.id === id
            ? { torusConfig: defaultConfig, id: '', previewUrl: '', userInput: '' }
            : state.newDesign,
          fusedDesign: state.fusedDesign?.id === id || affectsFusion ? null : state.fusedDesign,
          fusionSelection: (state.fusionSelection ?? []).filter((selectedId) => selectedId !== id),
          ...(affectsFusion ? { isFusing: false, fusionError: null } : {}),
        });
      },
      setSimilarDesigns: (designs) => set({ similarDesigns: designs }),
      setNewDesign: (design: DesignConfig) => {
        fusionRequestId += 1;
        set({
          newDesign: design,
          fusionSelection: [],
          fusedDesign: null,
          isFusing: false,
          fusionError: null,
        });
      },
      toggleFusionSelection: (id: string) => set((state) => {
        const selected = state.fusionSelection ?? [];
        if (selected.includes(id)) {
          return {
            fusionSelection: selected.filter((selectedId) => selectedId !== id),
            fusionError: null,
          };
        }

        if (!id || id === state.newDesign.id || selected.length >= 4) {
          return {
            fusionError: selected.length >= 4
              ? 'You can select up to four designs.'
              : 'The generated design cannot be selected as a source.',
          };
        }

        return {
          fusionSelection: [...selected, id],
          fusionError: null,
        };
      }),
      resetFusion: () => {
        fusionRequestId += 1;
        set({
          fusionSelection: [],
          fusedDesign: null,
          isFusing: false,
          fusionError: null,
        });
      },
      fuseDesigns: async (guidance?: string) => {
        const { newDesign, fusionSelection, isFusing } = get();
        if (isFusing) return;
        const selectedIds = [...new Set(fusionSelection ?? [])];
        if (!newDesign.id) {
          set({ fusionError: 'Generate a design before fusing.' });
          return;
        }
        if (selectedIds.length < 1 || selectedIds.length > 4) {
          set({ fusionError: 'Select between one and four similar designs to fuse.' });
          return;
        }
        if (selectedIds.includes(newDesign.id)) {
          set({ fusionError: 'The generated design cannot be selected as a source.' });
          return;
        }

        const requestId = ++fusionRequestId;
        set({ isFusing: true, fusionError: null, fusedDesign: null });
        try {
          const response = await fetch('http://localhost:5018/api/Gallery/fusion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              newDesignId: newDesign.id,
              similarDesignIds: selectedIds,
              ...(guidance?.trim() ? { guidance: guidance.trim() } : {}),
            } satisfies FusionRequest),
          });

          if (!response.ok) {
            let message = `Fusion failed (${response.status}).`;
            try {
              const error = await response.json();
              message = error.message ?? error.error ?? message;
            } catch {
              // Keep the status-based message when the server does not return JSON.
            }
            throw new Error(message);
          }

          const fusedDesign = await response.json() as DesignConfig;
          if (!fusedDesign?.id || !fusedDesign?.torusConfig) {
            throw new Error('Fusion returned an invalid design.');
          }
          if (requestId === fusionRequestId) set({ fusedDesign });
        } catch (error) {
          if (requestId === fusionRequestId) {
            set({
              fusionError: error instanceof Error ? error.message : 'Fusion failed. Please try again.',
            });
          }
        } finally {
          if (requestId === fusionRequestId) set({ isFusing: false });
        }
      },
      clearState: () => {
        fusionRequestId += 1;
        generationRequestId += 1;
        set({
          similarDesigns: [],
          newDesign: { torusConfig: defaultConfig, id: '', previewUrl: '', userInput: '' },
          selectedDesign: {} as DesignConfig,
          fusionSelection: [],
          fusedDesign: null,
          isFusing: false,
          fusionError: null,
          generationError: null,
          similarityError: null,
          isSearchingSimilar: false,
        });
      },
      updateDesignConfig: async (design: DesignConfig) => {
        try {
          const generatePromise = fetch(`http://localhost:5018/api/Gallery/designs/${design.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(design.torusConfig),
          });

          await generatePromise;

        } catch (err) {
          console.error('Error fetching designs:', err);
        }
      },
      fetchAndSetDesigns: async (input: string) => {
        fusionRequestId += 1;
        const requestId = ++generationRequestId;
        set({
          similarDesigns: [],
          fusionSelection: [],
          fusedDesign: null,
          isFusing: false,
          fusionError: null,
          generationError: null,
          similarityError: null,
          isSearchingSimilar: true,
        });

        const similarPromise = fetch(`http://localhost:5018/api/Gallery/similar/${encodeURIComponent(input)}`)
          .then(readResponse<DesignConfig[]>)
          .then((data) => {
            if (!Array.isArray(data)) throw new Error('Similarity search returned an invalid response.');
            if (requestId === generationRequestId) {
              set({ similarDesigns: data.filter((design) => !deletedDesignIds.has(design.id)) });
            }
          })
          .catch((error: unknown) => {
            if (requestId === generationRequestId) set({
              similarityError: error instanceof Error ? error.message : 'Similarity search failed.',
            });
          })
          .finally(() => {
            if (requestId === generationRequestId) set({ isSearchingSimilar: false });
          });
        const generatePromise = fetch(`http://localhost:5018/api/Gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          })
          .then(readResponse<DesignConfig>)
          .then((data) => {
            if (!data?.id || !data.torusConfig) throw new Error('Generation returned an invalid design.');
            if (requestId === generationRequestId) set({ newDesign: data });
          })
          .catch((error: unknown) => {
            if (requestId === generationRequestId) set({
              generationError: error instanceof Error ? error.message : 'Generation failed.',
            });
          });

        await Promise.all([similarPromise, generatePromise]);
      },
    }),
    {
      name: 'design-store',
      partialize: (state) => ({
        ...state, isFusing: false, fusionError: null,
        isSearchingSimilar: false, similarityError: null, generationError: null,
      }),
    }
  )
);

export default useStore;
