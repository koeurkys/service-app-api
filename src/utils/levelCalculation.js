/**
 * Système de progression de niveaux - Courbe hybride
 * 
 * Formule: xpNeeded = 100 + level * 50 + level^2 * 10
 * 
 * Permet:
 * - Début rapide (casual friendly)
 * - Milieu regular
 * - Endgame grind
 */

/**
 * Calcule l'XP requis pour passer du niveau N au niveau N+1
 * Formule: xpNeeded = 100 + level * 50 + level^2 * 10
 * @param {number} level - Le niveau actuel (1+)
 * @returns {number} Les XP nécessaires pour atteindre le prochain niveau
 */
function getXpRequiredForNextLevelStep(level) {
  return 100 + level * 50 + Math.pow(level, 2) * 10;
}

/**
 * Calcule l'XP cumulatif requis pour atteindre un niveau donné
 * @param {number} level - Le niveau cible (1+)
 * @returns {number} Les XP cumulatifs requis pour atteindre ce niveau
 */
export function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  
  let totalXp = 0;
  // Additionner tous les XP requis pour chaque transition jusqu'au niveau cible
  for (let i = 1; i < level; i++) {
    totalXp += getXpRequiredForNextLevelStep(i);
  }
  return totalXp;
}

/**
 * Calcule le niveau en fonction du XP total
 * @param {number} totalXp - XP total de l'utilisateur
 * @returns {number} Le niveau actuel (1+)
 */
export function calculateLevelFromXP(totalXp) {
  if (typeof totalXp !== "number" || totalXp < 0) {
    return 1;
  }

  let currentLevel = 1;

  // Chercher le dernier niveau atteint
  // Limiter à 100 niveaux pour éviter les boucles infinies
  for (let level = 2; level <= 100; level++) {
    const xpRequiredForThisLevel = getXpRequiredForLevel(level);
    if (totalXp >= xpRequiredForThisLevel) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

/**
 * Obtient les XP cumulatifs requis pour atteindre le prochain niveau
 * @param {number} level - Le niveau actuel (1+)
 * @returns {number} Les XP cumulatifs requis pour le prochain niveau
 */
export function getXpRequiredForNextLevel(level) {
  return getXpRequiredForLevel(level + 1);
}

/**
 * Calcule les statistiques de progression du niveau actuel
 * @param {number} totalXp - XP total de l'utilisateur
 * @returns {object} Objet avec progression, XP manquants, etc.
 */
export function calculateLevelProgress(totalXp) {
  const currentLevel = calculateLevelFromXP(totalXp);
  const xpForCurrentLevel = getXpRequiredForLevel(currentLevel);
  const xpForNextLevel = getXpRequiredForNextLevel(currentLevel);

  const xpInCurrentLevel = totalXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage =
    xpNeededForNextLevel > 0
      ? (xpInCurrentLevel / xpNeededForNextLevel) * 100
      : 0;

  return {
    currentLevel,
    totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage: Math.min(Math.round(progressPercentage), 100),
    xpRemaining: Math.max(0, xpForNextLevel - totalXp),
  };
}
