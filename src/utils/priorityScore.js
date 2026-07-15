export function priorityScore(s) {
  const readingGap = Math.max(0, 30 - s.reading)
  const arithmeticGap = Math.max(0, 30 - s.arithmetic)
  const dropoutFactor = s.girlsDropoutRisk
  const yearsFactor = s.yearsFlagged * 4
  const noInterventionPenalty = s.interventionRecorded ? 0 : 8

  return (
    readingGap * 1.2 +
    arithmeticGap * 1.2 +
    dropoutFactor * 0.8 +
    yearsFactor +
    noInterventionPenalty
  )
}


export function resourceGap(s) {
  let gaps = 0
  if (s.hasLibrary && !s.libraryUsed) gaps += 1
  if (s.hasComputer && !s.computerUsed) gaps += 1
  return gaps
}