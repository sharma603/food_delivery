import jwt from "jsonwebtoken";

const Authorization = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(400).send("Bad Request!")

    const [type, token] = auth.split(" ")
    if (type !== "Bearer")
        return res.status(400).send("Bad Request!")
    
    try {
        const user = await jwt.verify(token, process.env.JWT)
        req.user = user
        next()
    }
    catch (err) {
        console.log(err)
        return res.status(401).json({ message: "Invalid token" })
    }
}   

export default Authorization;