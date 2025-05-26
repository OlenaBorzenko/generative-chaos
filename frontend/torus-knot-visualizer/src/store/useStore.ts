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
  torusConfig: typeof defaultConfig;
};

type StoreState = {
  similarDesigns: DesignConfig[];
  newDesign: DesignConfig;
  selectedDesign: DesignConfig;
  setSimilarDesigns: (designs: DesignConfig[]) => void;
  setSelectedDesign: (design: DesignConfig) => void;
  setNewDesign: (design: DesignConfig) => void;
  clearState: () => void;
  fetchAndSetDesigns: (input: string) => Promise<void>;
};

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
      setSelectedDesign: (design: DesignConfig) => set({ selectedDesign: design }),
      setSimilarDesigns: (designs) => set({ similarDesigns: designs }),
      setNewDesign: (design: DesignConfig) => set({ newDesign: design }),
      clearState: () => set({
        similarDesigns: [], 
        newDesign: { torusConfig: defaultConfig, id: '' } as DesignConfig 
      }),
      fetchAndSetDesigns: async (input: string) => {
        set({ similarDesigns: [] });

        try {
          const similarPromise = fetch(`http://localhost:5018/api/Gallery/similar/${encodeURIComponent(input)}`);
          const generatePromise = fetch(`http://localhost:5018/api/Gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });

          similarPromise
            .then(res => res.json())
            .then((data: DesignConfig[]) => set({ similarDesigns: data }))
            .catch(err => console.error('Similar fetch failed', err));

          try {
            const generateRes = await generatePromise;
            const generatedData = await generateRes.json();
            set({ newDesign: generatedData });
          } catch (err) {
            console.error('Generation failed', err);
          }
        } catch (err) {
          console.error('Error fetching designs:', err);
        }
      },
    }),
    {
      name: 'design-store',
    }
  )
);

export default useStore;
