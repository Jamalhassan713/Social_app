


export const pagination = ({
    page = 1,
    limit = 10
}) => {
    if (Number(page) < 1) page = 1
    if (Number(page) < 1 || Number(limit) > 100) limit = 10
    const skip = (Number(page) - 1) * Number(limit)
    return { page, limit, skip }
}