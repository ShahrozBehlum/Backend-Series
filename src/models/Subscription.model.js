import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    chennal: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;