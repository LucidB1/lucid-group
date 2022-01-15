
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(3000)
        local players = GetPlayers();
        local playersData = {};

        for k,playerId in pairs(players) do
            local playerPed = GetPlayerPed(playerId);
            local coords = GetEntityCoords(playerPed)
            playersData[playerId] = {
                x =  coords.x,
                y =  coords.y,
                z =  coords.z,
                health =  GetEntityHealth(playerPed),
                name =  GetPlayerName(playerId),
                src =  playerId,
            }
        end
        TriggerClientEvent('lucid-group:syncPlayerData', -1, playersData)    
    end

end)



 DistanceBetweenCoords = function(coordsA, coordsB, useZ)
    -- language faster equivalent:
    local firstVec = vector3(coordsA.x, coordsA.y, coordsA.z)
    local secondVec = vector3(coordsB.x, coordsB.y, coordsB.z)
    if useZ then
        return #(firstVec - secondVec)
    else 
        return #(firstVec.xy - secondVec.xy)
    end
end

exports('betweencoords', function(coordsA, coordsB, useZ)
    return DistanceBetweenCoords(coordsA, coordsB, useZ)
end)