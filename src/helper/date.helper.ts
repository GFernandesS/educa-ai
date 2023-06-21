const oneHourInMs = 3600000

export function calculateDiffBetweenTwoDatesInHours(initialDate: Date, finalDate: Date): number {

    if(!initialDate || !finalDate )
        return 0

    return Math.abs(initialDate.getTime() - finalDate.getTime()) / oneHourInMs
}