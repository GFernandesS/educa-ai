export interface StorePrescriptionDto {
    storeName: string,
    chainRating: number,
    totalDelayInMinutes: number,
    callsNotAnswered: number,
    lastReviewsScoreAverage: number,
    reviewsScoreAverage: number,
    places: [{
        name: string,
        lastReviewScoreAverage: number,
        reviewsScoreAverage: number,
        opinion: string
        items: [{
            name: string,
            comments: string[],
            reviews: number[],
            lastReviewScore: number,
            reviewsScoreAverage: number
        }]
    }],
    sensation: {
        comment: string,
        lastReviewScore: number,
        reviews: number[]
        reviewsScoreAverage: number
    }
}