const nowInSeconds = () => Math.round(new Date().getTime() / 1000);

export const isTokenNotExpired = (issuedAt: number, expiresIn: number) => {
    const now = nowInSeconds();
    const tenMinutesInSeconds = 10 * 60 * -1;
    return now < issuedAt + expiresIn + tenMinutesInSeconds;
};
