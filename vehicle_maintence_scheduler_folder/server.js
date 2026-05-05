const express = require("express")
const axios = require("axios")
const logger = require("../logging_middleware/logger")

const app = express()
app.use(express.json())
app.use(logger)

const BASE = "http://20.207.122.201/evaluation-service"
const HEADERS = { Authorization: "Bearer EXfvDp" }

function solve(arr, cap){
    let n = arr.length
    let dp = Array.from({length:n+1},()=>Array(cap+1).fill(0))

    for(let i=1;i<=n;i++){
        let d = arr[i-1].Duration
        let v = arr[i-1].Impact
        for(let w=0;w<=cap;w++){
            if(d<=w){
                dp[i][w] = Math.max(v + dp[i-1][w-d], dp[i-1][w])
            }else{
                dp[i][w] = dp[i-1][w]
            }
        }
    }

    let w = cap
    let res = []
    for(let i=n;i>0;i--){
        if(dp[i][w] !== dp[i-1][w]){
            res.push(arr[i-1])
            w -= arr[i-1].Duration
        }
    }

    return res.reverse()
}

app.get("/optimize/:id", async (req,res)=>{
    try{
        let depots = await axios.get(`${BASE}/depots`,{headers:HEADERS})
        let vehicles = await axios.get(`${BASE}/vehicles`,{headers:HEADERS})

        let depot = depots.data.depots.find(d=>d.ID==req.params.id)
        if(!depot) return res.status(404).json({error:"Depot not found"})

        let result = solve(vehicles.data.vehicles, depot.MechanicHours)

        res.json({
            depotId: depot.ID,
            totalHours: depot.MechanicHours,
            totalImpact: result.reduce((s,x)=>s+x.Impact,0),
            totalDuration: result.reduce((s,x)=>s+x.Duration,0),
            vehicles: result.map(v=>v.TaskID)
        })
    }catch(e){
        res.status(500).json({error:"error"})
    }
})

app.listen(3000)