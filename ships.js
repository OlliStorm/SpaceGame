let fleets = [
    {
        "uuid": "test",
        "position": {
            "x": 0,
            "y": 0
        },
        "stats": {},
        "target": {},
        "ships": [
            {
                "uuid": "test_ship_1",
                "speed": 100,
                "sensor-range": 75,
            }
        ]
    }
];

function refreshFleets() {
    for (let fleet of fleets) {
        let sensorRange = 0;
        let speed = 99999;

        for (let ship of fleet.ships) {
            if (ship["sensor-range"] > sensorRange) {
                sensorRange = ship["sensor-range"];
            }
            if (ship["speed"] < speed) {
                speed = ship["speed"];
            }
        }

        fleet.stats["sensor-range"] = sensorRange;
        fleet.stats["speed"] = speed;
    }
}

refreshFleets();