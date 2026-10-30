export type PipeSection = {
  diameterMm: number;
  lengthM: number;
  quantity?: number;
};

export type InstallationVolumeInput = {
  sections: PipeSection[];
  meterVolumeM3?: number;
  purgeFactor?: number;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateInstallationVolume(input: InstallationVolumeInput) {
  const meterVolumeM3 = Math.max(Number(input.meterVolumeM3 ?? 0.0035), 0);
  const purgeFactor = Math.max(Number(input.purgeFactor ?? 1.5), 1);

  const sectionVolumes = (input.sections || []).map((section) => {
    const diameterM = Math.max(Number(section.diameterMm || 0), 0) / 1000;
    const lengthM = Math.max(Number(section.lengthM || 0), 0);
    const quantity = Math.max(Number(section.quantity || 1), 1);
    const volumeM3 = Math.PI * Math.pow(diameterM / 2, 2) * lengthM * quantity;
    return {
      diameterMm: Number(section.diameterMm || 0),
      lengthM,
      quantity,
      volumeM3: round(volumeM3),
    };
  });

  const pipeVolumeM3 = sectionVolumes.reduce((sum, section) => sum + section.volumeM3, 0);
  const installationVolumeM3 = pipeVolumeM3 + meterVolumeM3;
  const purgeVolumeM3 = installationVolumeM3 * purgeFactor;

  return {
    pipeVolumeM3: round(pipeVolumeM3),
    meterVolumeM3: round(meterVolumeM3),
    installationVolumeM3: round(installationVolumeM3),
    purgeVolumeM3: round(purgeVolumeM3),
    installationVolumeFt3: round(installationVolumeM3 * 35.3147),
    purgeVolumeFt3: round(purgeVolumeM3 * 35.3147),
    purgeFactor,
    sectionVolumes,
  };
}
