import { templatePackRegistry } from '@/packs/registry';
import { cloudletPitchPack } from '@/packs/cloudlet-pitch/index';
import { harperMinimalPack } from '@/packs/harper-minimal/index';
import { azulProposalPack } from '@/packs/azul-proposal/index';

/**
 * Registra los tres packs built-in de UNSAReport.
 * Se ejecuta como efecto lateral al importar este módulo.
 */
for (const pack of [cloudletPitchPack, harperMinimalPack, azulProposalPack]) {
  templatePackRegistry.registerPack(pack);
}
