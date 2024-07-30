const {Schema, model}= require('mongoose')
const {randomBytes, createHmac}=require('crypto')

const userSchema = Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    salt:{
        type:String,
    },
    password:{
        type:String,
        required:true
    },
    profileImage:{
        type:String,
        default:'/images/default.png'
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    }
},
{timestamps:true});

userSchema.pre("save", function(next){
    const user = this;
    if(!user.isModified('password')) return;

    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

    this.salt = salt;
    this.password = hashedPassword;

    next();
})

userSchema.static('matchPassword', async function(email,password){
    const user = await this.findOne({email});
    if(!user) throw new Error("User not found");

    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac('sha256', salt)
    .update(password)
    .digest('hex')

    if(hashedPassword!==userProvidedHash)
        throw new Error('Incorrect password')

    return user;
})

const User = model("user", userSchema)

module.exports=User;

