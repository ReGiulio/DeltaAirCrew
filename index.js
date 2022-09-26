const mineflayer = require('mineflayer')
const inventoryViewer = require('mineflayer-web-inventory')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const toolPlugin = require('mineflayer-tool').plugin
const autoeat = require("mineflayer-auto-eat")
var AutoAuth = require('mineflayer-auto-auth')
const pvp = require('mineflayer-pvp').plugin
const gui = require("mineflayer-gui")
const GoalFollow = goals.GoalFollow
var tpsPlugin = require('mineflayer-tps')(mineflayer)

const bot = mineflayer.createBot({
  host: '6b6t.org',
  username: 'DeltaAirCrew',
  version: 1.12
})

bot.loadPlugin(gui.plugin)

inventoryViewer(bot)

bot.loadPlugin(gui.plugin)

bot.gui.item.simpleItem

const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
bot.once('spawn', () => {
  mineflayerViewer(bot, { port: 3008, firstPerson: true }) // port is the minecraft server port, if first person is false, you get a bird's-eye view
})
bot.loadPlugin(pathfinder)

function followPlayer() {
const playerCI = bot.players['ReGiulio']

const mcData = require('minecraft-data')(bot.version)
const movements = new Movements(bot, mcData)
bot.pathfinder.setMovements(movements)

const goal = new GoalFollow(playerCI.entity, 1)
bot.pathfinder.setGoal(goal, true)
}

bot.once('spawn', followPlayer)

const ChatMessage = require('prismarine-chat')('1.16')

const msg = new ChatMessage({"text":"lol"})
console.log(msg.toString())


bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)


bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea (pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})

bot.on('physicTick', () => {
  if (!guardPos) return

  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
                      e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})

bot.on('chat', (username, message) => {
  if (message === 'guard') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('I will guard that location.')
    guardArea(player.entity.position)
  }

  if (message === 'fight me') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }

  if (message === 'stop') {
    bot.chat('I will no longer guard this area.')
    stopGuarding()
  }
})


bot.loadPlugin(autoeat)

bot.once("spawn", () => {
  bot.autoEat.options.priority = "foodPoints"
  bot.autoEat.options.bannedFood = []
  bot.autoEat.options.eatingTimeout = 3
})
bot.on("autoeat_started", () => {
  console.log("Auto Eat started!")
})

bot.on("autoeat_stopped", () => {
  console.log("Auto Eat stopped!")
})

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable()
  else bot.autoEat.enable()
})


bot.loadPlugin(tpsPlugin)

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  if (message === 'tps') {
    bot.chat('Current tps: ' + bot.getTps())
  }
})