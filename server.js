let ESX = null
emit('esx:getSharedObject', (obj) => (ESX = obj));

let groups = [];
const partyCost = 5000;



RegisterCommand('createg', (source, args) => {
    const src = source
    const ply = ESX.GetPlayerFromId(src)
    if (getPlayerGroup(src) == null) {

        if (ply.getMoney() >= partyCost) {

            ply.removeMoney(partyCost)
            groups.push({
                id: (Math.random().toString(36) + Date.now().toString(36)).substr(2),
                name: GetPlayerName(src) + "'s Group",
                members: [
                    {
                        citizenid: ply.identifier,
                        src: src,
                    },
                ],
                founder: ply.identifier,
            });
            emitNet("lucid-group:syncGroup", src, getPlayerGroup(src));

            emitNet('esx:showNotification', src, "Group Created")
        } else {
            emitNet('esx:showNotification', src, "You don't have enough money")
        }
    } else {
        emitNet('esx:showNotification', src, "You already in a group")

    }
})


onNet('lucid-group:shareXP', (xp) => {
    // You need to trigger this when player kill a zombie
    const src = source
    const playerGroup = getPlayerGroup(src);
    if (playerGroup != null) {
        xp = (xp / playerGroup.members.length).toFixed(0)
        xp = Math.round(xp)
        playerGroup.members.forEach((player) => {
            const [othercoordsX, othercoordsY, othercoordsZ] = GetEntityCoords(GetPlayerPed(player.src), true)
            const [playercoordsX, playercoordsY, playercoordsZ] = GetEntityCoords(GetPlayerPed(src), true)
            const dist = exports['lucid-group'].betweencoords({ x: playercoordsX, y: playercoordsY, z: playercoordsZ }, { x: othercoordsX, y: othercoordsY, z: othercoordsZ });
            if (dist < 100.0) {


                // addPlayerXp(player.src, xp)
            }
        })
    }
})





RegisterCommand('inviteg', (source, args) => {
    const target = args[0];
    const src = source
    if (isNaN(target)) {
        emitNet('esx:showNotification', src, 'Invalid id')


        return;
    }

    if (isPlayerFounderOfParty(src)) {
        if (getPlayerGroup(target) == null) {
            inviteParty(src, target)
        } else {
            emitNet('esx:showNotification', src, 'Player is already in a group')


        }

    }
})

onNet('lucid-group:requestAccepted', (party) => {
    joinParty(source, party)
})




const joinParty = (source, invitedparty) => {

    const src = source
    const ply =  ESX.GetPlayerFromId(src)
    const party = getGroupById(invitedparty.id)

    if (party != null) {
        party.members.push({
            citizenid: ply.identifier,
            src: src
        })
        emitNet('esx:showNotification', src, "You joined the group")

        party.members.forEach((player) => {

            const targetply = ESX.GetPlayerFromIdentifier(player.citizenid)
            if (targetply != null && targetply != undefined) {
                emitNet('lucid-group:syncGroup', targetply.source, getGroupById(invitedparty.id))
            }
        })

    } else {

        emitNet('esx:showNotification', src, "Invite expired")
    }
}

RegisterCommand('deleteg', (source, args) => {
    if (isPlayerFounderOfParty(source)) {
        const data = getPlayerGroup(source);
        deleteParty(data.id);
    } else {
        emitNet('esx:showNotification', source, "You're not founder of party")

    }
})



const inviteParty = (source, target) => {
    const src = source
    const data = getPlayerGroup(src)

    if (data != null) {
        emitNet("lucid-group:requestSended", target, data);
    }

}

const deleteParty = (id) => {
    const src = source
    if (id != null) {

        let data = getGroupById(id);
        data.members.forEach((player) => {
            const member = ESX.GetPlayerFromIdentifier(player.citizenid)
            if (member != null && member != undefined) {
                emitNet("lucid-group:syncGroup", member.source, null);
            }
        });
        groups = groups.filter((group) => group.id != id);
    } else {

        emitNet('esx:showNotification', src, "You can't use this command")

    }
}




RegisterCommand('leaveg', (source) => {
    const src = source
    const data = getPlayerGroup(src)
    if (data != null) {
        if (isPlayerFounderOfParty(src)) {
            if (getGroupMemberCount(data.id) > 1) {
                passFounder(src);
            }
            leaveParty(src);

        } else {
            leaveParty(src)
        }
    } else {
        emitNet('esx:showNotification', src, "You're not in a group")

    }
})


on('playerDropped', () => {
    const src = source
    const data = getPlayerGroup(src)
    if (data != null) {
        leaveParty(src)
    }
})


const leaveParty = (source) => {
    const src = source
    const ply = ESX.GetPlayerFromId(src)
    const data = getPlayerGroup(source)
    const group = getGroupById(data.id)
    if (data != null) {

        group.members = group.members.filter((member) => member.citizenid != ply.identifier)
        emitNet("lucid-group:syncGroup", src, null);
        emitNet('esx:showNotification', src, "You're leave from the group")


        emitNet("lucid-group:playerLeaveFromGroup", src);


        group.members.forEach((member) => {
            const targetply = ESX.GetPlayerFromIdentifier(member.citizenid)

            if (targetply != null && targetply != undefined) {
                emitNet("lucid-group:syncGroup", targetply.source, data);
                emitNet("lucid-group:playerLeaveFromGroup", targetply.source);
            }
        });
        if (getGroupMemberCount(group.id) <= 0 && getGroupMemberCount(group.id) != null) {
            deleteParty(group.id);
        }
    } else {
        emitNet('esx:showNotification', src, "You're not in a group")
    }
}


const passFounder = (source) => {
    const data = getPlayerGroup(source)
    if (data != null) {
        const tick = setTick(() => {
            let rndPly = Math.floor(Math.random() * data.members.length);
            let luckyPly = data.members[Number(rndPly)].citizenid
            if (luckyPly != data.founder) {
                data.founder = luckyPly
                clearTick(tick);
            }
        });
    }
}

const isPlayerFounderOfParty = (source) => {
    const src = source
    const ply = ESX.GetPlayerFromId(src)
    const party = getPlayerGroup(src)
    let retval = false

    if (party != null) {
        if (party.founder == ply.identifier) {
            retval = true
        }
    }


    return retval
}




const getGroupById = (id) => {
    const data = groups.filter((item) => {
        return item.id == id
    })
    return data[0] || null

}

const getGroupMemberCount = (id) => {
    const group = getGroupById(id);
    if (group != null) {
        return group.members.length;
    }

    return null
}



const getPlayerGroup = (source) => {
    const src = source
    let ply = ESX.GetPlayerFromId(Number(src))
    const data = groups.filter((item) => {
        for (let i = 0; i < item.members.length; i++) {
            if (item.members[i].citizenid == ply.identifier) {
                return item.members[i].citizenid == ply.identifier
            }

        }

    })
    return data[0] || null
}