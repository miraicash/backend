var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    bcrypt = require("bcrypt"),
    generator = require("creditcard-generator");
SALT_WORK_FACTOR = 10;

var TransactionSchema = new Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
});

var WalletSchema = new Schema({
    card: {
        number: { type: Number, required: true, default: parseInt(generator.GenCC("VISA")[0]) },
        cvv: { type: Number, required: true, default: Math.floor(100 + Math.random() * 900) },
        expiry: {
            type: Number,
            required: true,
            default: parseInt(`${("0" + Math.floor(Math.random() * 12) + 1).slice(-2)}${Math.floor(Math.random() * (99 - 25 + 1)) + 25}`),
        },
        btc_address: { type: String, required: true, default: generateBTCAddress() },
    },
    balance: {
        cash: { type: Number, required: true, default: 0 },
        crypto: { type: Number, required: true, default: 0 },
    },
});

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    transactions: {
        cash: [TransactionSchema],
        crypto: [TransactionSchema],
    },
    wallet: WalletSchema,
});

UserSchema.pre("save", function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified("password")) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

function generateBTCAddress() {
    let length = 33;
    const characters = "abcdefghijklmnopqrstuvwxyz1234567890AVCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = mongoose.model("User", UserSchema);
