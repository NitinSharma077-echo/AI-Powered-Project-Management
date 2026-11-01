const mongoose = require("mongoose");

const notes=new mongoose.Schema(
    {
        meetingID:{
            type:String,
            required:true},
        content:{
            type:String,
            required:true},
    }
)

module.exports=mongoose.model("Notes",notes)