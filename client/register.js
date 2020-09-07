const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();

const PORT = 5000;


const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.static(__dirname + '/public'));

app.get('/register', async (req, res) => {
    const { firstName, lastName, unitCode, email, phone } = req.query;

    try{
        await client.connect();
        const collection = await client.db("firstdb").collection("Users").insertOne(
            {
                firstName: firstName,
                lastName: lastName,
                unitCode: unitCode,             
                email: email,    
                phone: phone
            }
        )
        res.send(JSON.stringify(collection.ops));

    } catch (err) {
        console.log(err);
        res.send('User Register Failed!! Please try again!!!');
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})