const express = require('express');
const router = express.Router();
const{
    createProject,
    getProjectForOwner,
    getProjectById
}=require("../services/project.service");

router.get("/",async(req,res,next)=>{
    try{
        const projects=await getProjectForOwner(req.user.id);
        res.status(200).json(projects);
    }
    catch(err){
        next(err);
    }
});

router.get("/:projectId",async(req,res,next)=>{
    try{
        const project=await getProjectById(req.user.id,req.params.projectId);
        if(!project){
            return res.status(404).json({ error: "Project not found" });
        }
        res.status(200).json(project);
    }
    catch(err){
        next(err);
    }
});

router.post("/",async(req,res,next)=>{
    try{
        const project=await createProject(req.body,req.user.id);
        res.status(201).json(project);
    }
    catch(err){
        next(err);
    }
});

module.exports = router;
