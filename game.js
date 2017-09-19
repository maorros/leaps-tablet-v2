/*
  TODO: 
    - use query params to give the starting scene

    - sound effects
    subtitles = load file with ID: text li"ne
    one file per language

    audio: one long track, with exported markers on IDs to start times and lengths
    - transition from logo by finding solution to puzzle (make left and right appear)


  SCRIPT
    Americans love bananas
    In 2015, an average Americans ate 14 oranges, and 32 apples.
    Guess how many bananas they ate?
    -> That's right. 46 bananas, as many apples and oranges combined. 

    // reference : http://www.pbhfoundation.org/pdfs/about/res/pbh_res/State_of_the_Plate_2015_WEB_Bookmarked.pdf

    most bananas will die...
    we eat so many bananas, how is this possible?
    show logo?
    what are fruit?
      fruit are a way for plants to get animals to spread their seeds - "say you're a plant and you want to spread your seeds"
      there are other ways to spread seeds of course: wind and water
      but fruit takes advantage of animals, which bring the seeds far and wide, and deposit them in "fertaliser"
      trick is:
        fruit must be tasty (e.g. lots of sugar)
        that seeds must be tough enough to survive digestion
          (in fact there are fruit that have really big seeds that no animals eat anymore)

    most fruit was changed through agriculture
      ex. game where you pick the best species and cross them 
      match up original fruit against their modern counterparts
      use a slider to see how it changes over time?

    fruit has seeds, banana is fruit, so where are the seeds?
    in fact they are there but we take them out using hybridization
      explain genetics of diploid / tetraploid
      revisit previous game but with hybrid approach
    result is it's more difficult to improve over time, and more susceptible to disease
      return to farm game, this time disease hits
        your polyculture plants survived (from 1st game time)
        but your monoculture bananas die
    this is what happened to the gros michel banana
      similar things happened in the potato famine
    and reports are that the panana disease is adapting to the cavendish
    what could happen now?
      hybrids (diffocult)
      genetic engineering (unpopular)
    or we embrace diversity - other bananas exist


  NOTES
    recent study links larger brains in primates to those who eat fruit rather than leaves



*/

const appSize = [800, 600];

const DEBUG_PHYSICS = false;

class Entity {
  setup() {}
  update(timeSinceStart, timeScale) {}
  teardown() {}
  requestedTransition(timeSinceStart) { return null; } // Provide string transition name, such as "next"
}

class SubtitleRunner {
  // Takes array of [time, text]
  constructor(subtitlesAndTimes) {
    this.subtitlesAndTimes = subtitlesAndTimes;
  }

  setup() { 
    this.index = -1;

    changeSubtitle(); 
  }

  update(timeSinceStart, timeScale) {
    if(this.index >= this.subtitlesAndTimes.length - 1) return;

    if(this.subtitlesAndTimes[this.index + 1][0] <= timeSinceStart) {
      this.index++;
      changeSubtitle(this.subtitlesAndTimes[this.index][1]);
    }
  }

  teardown() { changeSubtitle(); }

  requestedTransition(timeSinceStart) { 
    return this.index >= this.subtitlesAndTimes.length - 1 ? "next" : null; 
  } 
}


function makeSprite(name) { 
  return new PIXI.Sprite(app.loader.resources[name].texture);
}

function randomPos() {
  return [appSize[0] * Math.random(), appSize[1] * Math.random()];
}

function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

function distanceBetweenPixiPoints(a, b) {
  let x = a.x - b.x;
  let y = a.y - b.y;
  return Math.sqrt(x*x + y*y);
}

class IntroScene extends Entity {
  setup() {
    this.engine = Matter.Engine.create();
    
    if(DEBUG_PHYSICS) {
      var render = Matter.Render.create({
          element: document.body,
          engine: this.engine
      });

      Matter.Render.run(render);      
    }
    
    const ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(0, appSize[1] / 2, 60, appSize[1], { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(appSize[0], appSize[1] / 2, 60, appSize[1], { isStatic: true });
    Matter.World.add(this.engine.world, [ground, leftWall, rightWall]);

    this.container = new PIXI.Container();
    this.container.interactive = true;
    this.container.width = appSize[0];
    this.container.height = appSize[1];
    sceneLayer.addChild(this.container);

    let rectangle = new PIXI.Graphics();
    //rectangle.lineStyle(4, 0xFF3300, 1);
    rectangle.beginFill("black");
    rectangle.drawRect(0, 0, appSize[0], appSize[1]);
    rectangle.endFill();
    rectangle.interactive = true;
    rectangle.on("pointertap", () => { this.onClick(); }); // TODO: use bind() instead?
    rectangle.on("pointermove", (e) => { this.onMove(e); })
    this.container.addChild(rectangle);

    // Phases are beforeOrange, orange, beforeApple, apple, beforeBanana, banana, eat, outro, done
    this.phase = "beforeOrange";
    this.orangeCount = 0;
    this.appleCount = 0;
    this.bananaCount = 0;
    this.lastFruitTime = 0;

    // Matching arrays of bodies and their sprites
    this.bodies = [];
    this.sprites = [];

    changeSubtitle("Americans love bananas.\nIn 2015, an average Americans ate");
  }

  randomDropPos() {
    return [(0.1 + 0.8 * Math.random()) * appSize[0], appSize[1] * -0.1];
  }

  update(timeSinceStart, timeScale) {
    switch(this.phase) {
      case "orange":
        if(this.orangeCount >= 14) {
          this.phase = "beforeApple";
        } else if(this.lastFruitTime + 500 < timeSinceStart) {
          this.makeOrange(this.randomDropPos());
          this.orangeCount++;
          this.lastFruitTime = timeSinceStart;
        }
        break;

      case "apple":
        if(this.appleCount >= 32) {
          this.phase = "beforeBanana";
        } else if(this.lastFruitTime + 300 < timeSinceStart) {
          this.makeApple(this.randomDropPos());
          this.appleCount++;
          this.lastFruitTime = timeSinceStart;
        }
        break;

      case "banana":
        if(this.bananaCount >= 46) {
          this.phase = "eat";

          this.makeMouth();
          changeSubtitle("And yet, scientists say that soon, most bananas will be completely gone")
        } else if(this.lastFruitTime + 200 < timeSinceStart) {
          this.makeBanana(this.randomDropPos());
          this.bananaCount++;
          this.lastFruitTime = timeSinceStart;
        }
        break;

      case "eat":
        if(this.sprites.length == this.appleCount + this.orangeCount)
        {
          this.phase = "outro";

          this.container.removeChild(this.mouth);
          changeSubtitle("How could that be possible?")
        }
        else
        {
          // look for the first sprite that is within the mouth size and remove it
          let foundSprite = false;
          for(let i = this.appleCount + this.orangeCount; !foundSprite && i < this.sprites.length; i++) {
            if(distanceBetweenPixiPoints(this.sprites[i].position, this.mouth.position) < 75)
            {
              // Remove graphics
              this.container.removeChild(this.sprites[i]);
              this.sprites.splice(i, 1);

              // Remove physics
              Matter.World.remove(this.engine.world, this.bodies[i]);
              this.bodies.splice(i, 1);

              foundSprite = true;
            } 
          }
        }
        break;
    }

    Matter.Engine.update(this.engine, timeScale * 1000 / 60);

    for(let i = 0; i < this.bodies.length; i++)
    {
      const sprite = this.sprites[i];
      const body = this.bodies[i];
      sprite.position.set(body.position.x, body.position.y);
      sprite.rotation = body.angle;
    }
  }

  requestedTransition() { return this.phase == "done" ? "next" : null; }

  onClick(e) {
    switch(this.phase) {
      case "beforeOrange":
        this.phase = "orange";

        changeSubtitle("14 oranges");
        break;

      case "beforeApple":
        this.phase = "apple";

        changeSubtitle("and 32 apples");
        break;

      case "beforeBanana":
        this.phase = "banana";

        changeSubtitle("but a whopping 46 bananas, as many as all those apples and oranges combined");
        break;

      case "outro":
        this.phase = "done";
        break
    }
  }

  onMove(e) {
    switch(this.phase) {
      case "eat":
        this.mouth.position = e.data.getLocalPosition(app.stage);
        break;
    }
  }

  teardown() {
    sceneLayer.removeChild(this.container);
  }

  makeOrange(pos) { 
    const sprite = makeSprite("images/orange.png");
    sprite.scale.set(0.125);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(pos[0], pos[1]);
    this.container.addChild(sprite);

    const body = Matter.Bodies.circle(pos[0], pos[1], 28);
    Matter.World.addBody(this.engine.world, body);
    this.sprites.push(sprite);
    this.bodies.push(body);

    return sprite;
  }

  makeApple(pos) { 
    const sprite = makeSprite("images/apple.png");
    sprite.scale.set(0.125);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(pos[0], pos[1]);
    this.container.addChild(sprite);

    const body = Matter.Bodies.circle(pos[0], pos[1], 28);
    Matter.World.addBody(this.engine.world, body);
    this.sprites.push(sprite);
    this.bodies.push(body);

    return sprite;
  }

  makeBanana(pos) { 
    const sprite = makeSprite("images/banana.png");
    sprite.scale.set(0.05);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(pos[0], pos[1]);
    this.container.addChild(sprite);

    const body = Matter.Bodies.rectangle(pos[0], pos[1], 80, 40);
    Matter.World.addBody(this.engine.world, body);
    this.sprites.push(sprite);
    this.bodies.push(body);

    return sprite;
  }

  makeMouth() {
    this.mouth = new PIXI.Graphics();
    this.mouth.lineStyle(4, 0xFFFFFF, 1);
    this.mouth.beginFill("green");
    this.mouth.drawCircle(0, 0, 75);
    this.mouth.endFill();
    this.container.addChild(this.mouth);
  }
}

class LogoScene extends Entity {
  setup() {
    this.subtitleRunner = new SubtitleRunner([
      [0, "This is Play Curious."],
      [2000, "A series of playful interactions about topics ranging from science to history,"],
      [5000, "from design to economics."],
      [7000, "There's a new episode every 2 weeks,"],
      [9000, "so check us out at playcurious.com,"],
      [12000, "and download our phone app so you don't miss any."],
      [14000, "Now back to bananas."],
      [17000, ""],
    ]);
    this.subtitleRunner.setup();


    this.container = new PIXI.Container();
    this.container.interactive = true;
    this.container.width = appSize[0];
    this.container.height = appSize[1];
    sceneLayer.addChild(this.container);

    this.logo = makeSprite("images/logo.png");

    this.blurFilter = new PIXI.filters.BlurFilter();
    this.blurFilter.blur = 0;

    this.noiseFilter = new PIXI.filters.NoiseFilter();
    this.noiseFilter.noise = 0;

    this.logo.filters = [this.blurFilter, this.noiseFilter];
    this.logo.interactive = true;
    this.logo.on("pointermove", this.onPointerMove.bind(this))
    this.container.addChild(this.logo);

    changeSubtitle();
  }

  update(timeSinceStart, timeScale) {
    this.noiseFilter.seed = Math.random();

    this.subtitleRunner.update(timeSinceStart, timeScale);
  }

  requestedTransition(timeSinceStart) { return  this.subtitleRunner.requestedTransition(); }

  teardown() {
    sceneLayer.removeChild(this.container);
    this.subtitleRunner.teardown();
  }

  onPointerMove(e) {
    const pointerPos = e.data.getLocalPosition(app.stage);
    const xFrac = clamp(pointerPos.x / appSize[0], 0, 1); 
    this.noiseFilter.noise = xFrac;
    const yFrac = clamp(pointerPos.y / appSize[0], 0, 1); 
    this.blurFilter.blur = 20 * yFrac;
  }

}

function provideNextScene(currentScene, requestedTransition) {
  switch(currentScene.constructor.name) {
    case "IntroScene":
      return new LogoScene();
      break;

    default:
      console.error("No transition from", currentScene, "with transition", requestedTransition);
      return null;
  }
}


const app = new PIXI.Application();
document.body.appendChild(app.view);

app.loader
  .add("images/apple.png")
  .add("images/orange.png")
  .add("images/banana.png")
  .add("images/logo.png")
  .on("progress", loadProgressHandler)
  .load(setup);


// Scale canvas on 
scaleToWindow(app.view);

window.addEventListener("resize", function(event){ 
  scaleToWindow(app.view);
});

// Doesn't work on fullscreen

//document.addEventListener("fullscreenchange", function( event ) { scaleToWindow(app.view); });

// var requestFullScreen = document.documentElement.requestFullscreen || 
//   document.documentElement.mozRequestFullScreen || 
//   document.documentElement.webkitRequestFullscreen ||
//   document.documentElement.msRequestFullscreen;

function requestFullScreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function loadProgressHandler(loader, resource) {
  //Display the file `url` currently being loaded
  console.log("loading: " + resource.url); 

  //Display the precentage of files currently loaded
  console.log("progress: " + loader.progress + "%"); 

  //If you gave your files names as the first argument 
  //of the `add` method, you can access them like this
  //console.log("loading: " + resource.name);
}

let sceneLayer;
let subtitle;

const defaultStartingScene = "intro";

function getStartingScene() {
  const sceneName = new URL(document.location).searchParams.get("scene") || defaultStartingScene;
  switch(sceneName) {
    case "intro": return new IntroScene();
    case "logo": return new LogoScene();
  } 
}

function setup() {
  sceneLayer = new PIXI.Container();
  app.stage.addChild(sceneLayer);

  subtitle = new PIXI.Text("", {
    fontFamily: "Arial", 
    fontSize: 32, 
    fill: "white",
    strokeThickness: 4,
    align: "center",
    wordWrap: true,
    wordWrapWidth: appSize[0] - 100
  });

  subtitle.anchor.set(0.5, 0.5);

  subtitle.position.set(app.renderer.width / 2, app.renderer.height - 100);
  app.stage.addChild(subtitle); 


  app.ticker.add(update);

  // Start scene
  changeScene(getStartingScene());
}

let currentScene;
let sceneStartedAt = 0;

function changeScene(newScene) {
  if(currentScene) currentScene.teardown();

  newScene.setup();
  currentScene = newScene;
  sceneStartedAt = Date.now();
  newScene.update(0);
}

function update(timeScale)
{
  const timeSinceStart = Date.now() - sceneStartedAt;
  currentScene.update(timeSinceStart, timeScale);

  const requestedTransition = currentScene.requestedTransition(timeSinceStart);
  if(requestedTransition != null) {
      const nextScene = provideNextScene(currentScene, requestedTransition);
      if(nextScene != null) changeScene(nextScene);
  }
  app.renderer.render(app.stage);
}

function changeSubtitle(text) {
  subtitle.text = text;
}

