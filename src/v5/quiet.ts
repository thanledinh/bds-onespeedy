import gsap from 'gsap';

/**
 * The calmer pages reuse Option C's script (src/v3/profile.ts), which also animates
 * pieces these pages leave out on purpose (stories, bento tiles). Without this, GSAP
 * logs a warning for every missing target. Import this before the shared script.
 */
gsap.config({ nullTargetWarn: false });
