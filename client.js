let invite = null
let playerGroup = null
let playersData = [];
let blips = [];


let ESX = null;
let esxTick = setTick(() => {
    if (ESX) return clearTick(esxTick);
    emit('esx:getSharedObject', (obj) => (ESX = obj));
});





onNet("lucid-group:syncPlayerData", (data) => {

    playersData = data;
});


onNet('lucid-group:requestSended', (data) => {

    ESX.ShowNotification(' new request from ' + data.name + ' type /group join to accept')

    invite = data;
})

onNet('lucid-group:syncGroup', (group) => {
    console.log('Syncing group ', JSON.stringify(group))
    playerGroup = group;
})



setTick(async () => {
    await Wait(3000)
    if (playerGroup != null) {
        playerGroup.members.forEach((player) => {
            const data = playersData[player.src];
            if (data) {
                if (blips[player.src] == null) {
                    if (player.src != GetPlayerServerId(PlayerId())) {
                        let blip = AddBlipForCoord(data.x, data.y, data.z);
                        SetBlipAsShortRange(blip, true);
                        SetBlipDisplay(blip, 4);
                        SetBlipScale(blip, 0.7);
                        SetBlipSprite(blip, 1);
                        SetBlipShowCone(blip, true);
                        BeginTextCommandSetBlipName("STRING");
                        AddTextComponentString(data.name);
                        EndTextCommandSetBlipName(blip);
                        SetBlipCategory(blip, 1);
                        N_0x82cedc33687e1f50(false);
                        blips[player.src] = {};
                        blips[player.src].blip = blip;
                    }
                } else {
                    SetBlipCoords(blips[player.src].blip, data.x, data.y, data.z)
                }
            }
        })
    }
})




exports('getPlayerGroup', () => playerGroup)

const isPlayerFounderOfParty = () => {
    let retval = false
    if (playerGroup.founder == ESX.GetPlayerData().identifier) {
        retval = true
    }
    return retval;
}

RegisterCommand('found', () => {
    console.log(isPlayerFounderOfParty())

})

onNet("lucid-group:playerLeaveFromGroup", () => {
    blips.forEach((blip) => {
        if (DoesBlipExist(blip.blip)) {
            RemoveBlip(blip.blip);
        }
    });

    blips = {};
});

let isOpen = false

setTick(async () => {
    await Wait(1500)
    if (playerGroup != null) {
        let players = []
        playerGroup.members.forEach((player) => {
            const isLeader = isPlayerFounderOfParty(player.src)
            const data = playersData[player.src];
            if (data != null && data != undefined) {
                let [playerx, playery, playerz] = GetEntityCoords(PlayerPedId())
                const dist = GetDistanceBetweenCoords(data.x, data.y, data.z, playerx, playery, playerz, true).toFixed(1)
                players.push({
                    src: player.src,
                    dist,
                    name: data.name,
                    health: data.health - 100,
                    level: player.level,
                    partyname: playerGroup.name,
                    isLeader,
                })

                isOpen = true
                SendNuiMessage(
                    JSON.stringify({
                        action: "update",
                        players,
                        source: GetPlayerServerId(PlayerId()),
                    })
                );
            }
        })
    } else {
        if (isOpen) {
            isOpen = false

            SendNuiMessage(
                JSON.stringify({
                    action: "close",
                })
            );
        }
    }
})

RegisterCommand('group', (source, args) => {

    if (invite != null) {
        if (args[0] == "join") {
            emitNet('lucid-group:requestAccepted', invite)
        }
    } else {
        ESX.ShowNotification('You have no invite.')
    }

})


const Wait = (ms) => {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
};