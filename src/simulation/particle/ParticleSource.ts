import { Vec3, vScale, vNorm, vCross, ParticleSpecies, getSpecies, energyToVelocity, PhysicalConstants } from '../core';
import { ParticleState, createParticle } from './ParticleState';

export interface SourceConfig {
  species: ParticleSpecies;
  energyMeV: number;
  count: number;
  center: Vec3;
  radius: number;
  relativistic: boolean;
}

function randomDirection(): Vec3 {
  const u = 2 * Math.random() - 1;
  const phi = 2 * Math.PI * Math.random();
  const r = Math.sqrt(1 - u * u);
  return { x: r * Math.cos(phi), y: r * Math.sin(phi), z: u };
}

function randomInDisk(normal: Vec3, radius: number): Vec3 {
  const r = radius * Math.sqrt(Math.random());
  const theta = 2 * Math.PI * Math.random();
  let tangent: Vec3;
  if (Math.abs(normal.z) < 0.99) {
    tangent = vNorm(vCross(normal, { x: 0, y: 0, z: 1 }));
  } else {
    tangent = vNorm(vCross(normal, { x: 1, y: 0, z: 0 }));
  }
  const bitangent = vCross(normal, tangent);
  return {
    x: r * (Math.cos(theta) * tangent.x + Math.sin(theta) * bitangent.x),
    y: r * (Math.cos(theta) * tangent.y + Math.sin(theta) * bitangent.y),
    z: r * (Math.cos(theta) * tangent.z + Math.sin(theta) * bitangent.z),
  };
}

export function generateIsotropicSource(config: SourceConfig): ParticleState[] {
  const particles: ParticleState[] = [];
  const energyJ = config.energyMeV * 1e6 * PhysicalConstants.e;
  const speed = energyToVelocity(
    getMass(config.species),
    energyJ,
    config.relativistic
  );

  for (let i = 0; i < config.count; i++) {
    const dir = randomDirection();
    const offset = randomInDisk(dir, config.radius);
    const pos = {
      x: config.center.x + offset.x,
      y: config.center.y + offset.y,
      z: config.center.z + offset.z,
    };
    const vel = vScale(dir, speed);
    particles.push(createParticle(i, config.species, pos, vel, config.relativistic));
  }
  return particles;
}

export function generateDirectedSource(
  config: SourceConfig,
  direction: Vec3,
  spreadDeg: number = 0
): ParticleState[] {
  const particles: ParticleState[] = [];
  const energyJ = config.energyMeV * 1e6 * PhysicalConstants.e;
  const speed = energyToVelocity(
    getMass(config.species),
    energyJ,
    config.relativistic
  );
  const dirNorm = vNorm(direction);
  const spreadRad = (spreadDeg * Math.PI) / 180;

  for (let i = 0; i < config.count; i++) {
    let dir: Vec3;
    if (spreadDeg > 0) {
      const u = 2 * Math.random() - 1;
      const phi = 2 * Math.PI * Math.random();
      const coneCos = 1 + (u - 1) * (1 - Math.cos(spreadRad));
      const coneSin = Math.sqrt(1 - coneCos * coneCos);
      let tangent: Vec3;
      if (Math.abs(dirNorm.z) < 0.99) {
        tangent = vNorm(vCross(dirNorm, { x: 0, y: 0, z: 1 }));
      } else {
        tangent = vNorm(vCross(dirNorm, { x: 1, y: 0, z: 0 }));
      }
      const bitangent = vCross(dirNorm, tangent);
      dir = {
        x: coneCos * dirNorm.x + coneSin * (Math.cos(phi) * tangent.x + Math.sin(phi) * bitangent.x),
        y: coneCos * dirNorm.y + coneSin * (Math.cos(phi) * tangent.y + Math.sin(phi) * bitangent.y),
        z: coneCos * dirNorm.z + coneSin * (Math.cos(phi) * tangent.z + Math.sin(phi) * bitangent.z),
      };
    } else {
      dir = { ...dirNorm };
    }
    const offset = randomInDisk(dir, config.radius);
    const pos = {
      x: config.center.x + offset.x,
      y: config.center.y + offset.y,
      z: config.center.z + offset.z,
    };
    const vel = vScale(dir, speed);
    particles.push(createParticle(i, config.species, pos, vel, config.relativistic));
  }
  return particles;
}

function getMass(species: ParticleSpecies): number {

  return getSpecies(species).mass;
}