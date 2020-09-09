const MongoClient = require('mongodb').MongoClient;

// Load the database object
const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


class UserHelper {
    constructor(){}

    /**
     * @description Get all users from the database (all registered users).
     * 
     * @returns {Array} an Array of user objects retrieved from database.
     * 
     * @throws an error if an empty document is returned from the database (Nothing found from database).
     */
    getUsersList = async () => {
        try {
            await client.connect();
            
            const usersList = await client.db("firstdb").collection("Users").find({}).toArray();
    
            if (!usersList) {
                throw new Error ("Nothing found from database");
            }
    
            return usersList;
        } catch (err) {
            console.log(`Problems getting users from database ${err}`);
        } 
    }

    /**
     * @description Check if the input user exists in the registered users database.
     * 
     * @param {string} firstName first name to check against data in the database. The parameter is derived from user's input in frontend forms.
     * @param {string} lastName last name to check against data in the database. The parameter is derived from user's input in frontend forms.
     * 
     * @returns {boolean} The boolean value confirming that the user exists in the database (registered). True is returned if the user exists, and False is returned if doesn't.
     */
    userExistsCheck = async (firstName, lastName) => {
        try {
            await client.connect();
    
            const firstNameExists = await client.db("firstdb").collection("Users").find( {"firstName" : firstName} ).toArray();
            const lastNameExists = await client.db("firstdb").collection("Users").find( {"lastName" : lastName} ).toArray();
    
            if ((firstNameExists.length !== 0) && 
                (lastNameExists.length !== 0) && 
                (firstNameExists[0]._id.toString() === lastNameExists[0]._id.toString()) ) {
                return true;
            } else {
                return false;
            }
    
        } catch (err) {
            console.log(`Errors checking user existence: ${err}`);
        }   
    }

}

module.exports = UserHelper;