const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/user',{})
        console.log('mongoDB connected')
    }catch(err){
        console.error(err)
        process.exit(1)
    }

}

module.exports = connectDB