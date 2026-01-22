import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();



router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const services = await sql`
        SELECT * FROM services WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        res.status(200).json(services);
        
    } catch (error) {
        console.log("Error getting the services", error);
        res.status(500).json({ message: "Internal server Error"});
    }
});


router.post("", async (req, res) => {
    try {
        const {user_id,title,description,amount,category} = req.body;
        
        if (!title || !category || !user_id || !description || amount == undefined) {
            return res.status(400).json({ message : "All fields are required" });
        }
        
        const service = await sql `
        INSERT INTO services(user_id, title, description, amount, category)
        VALUES (${user_id}, ${title}, ${description}, ${amount}, ${category})
        RETURNING *
        `;
        
        console.log(service);
        res.status(201).json(service[0]);
        
    } catch (error) {
        console.log("Error creating the services", error);
        res.status(500).json({ message: "Internal server Error"});
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({message : "Invalid service ID"});
        }
        const result = await sql`
        DELETE FROM services WHERE id = ${id} RETURNING *
        `;
        if (result.length === 0) {
            return res.status(404).json({ message: "service not found"});
        }

        res.status(200).json({ message: "service deleted successfully"});
        
    } catch (error) {
        console.log("Error deleting the services", error);
        res.status(500).json({ message: "Internal server Error"});
    }
});


export default router;