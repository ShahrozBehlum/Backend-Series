import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';//npm i mongoose-aggregate-paginate-v2

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,  //cloudinaru url
        required: true
    },
    thumbnail: {
        type: String,  //cloudinaru url
        required: true
    },
    title: {
        type: String,  
        required: true
    },
    description: {
        type: String,  
        required: true
    },
    duration: {
        type: Number,  //cloudinaru url
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
    
}, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);
export default Video;