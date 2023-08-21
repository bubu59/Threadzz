import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
    
});

const Community = mongoose.models.Community || mongoose.model("Community", communitySchema);

export default Community;