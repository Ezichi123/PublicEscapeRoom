let level = 1;

/* LEVEL DATA */
const levels = {
  1: {
    code: "472",
    clues: {
      note: "Starts with 4",
      box: "Ends with 2",
      computer: "Middle is 7"
    }
  },
  2: {
    code: "935",
    clues: {
      note: "Starts with 9",
      box: "Ends with 5",
      computer: "Middle is 3"
    }
  },
  3: {
    code: "681",
    clues: {
      note: "Starts with 6",
      box: "Ends with 1",
      computer: "Middle is 8"
    }
  },
  4: {
    code: "204",
    clues: {
      note: "Starts with 2",
      box: "Ends with 4",
      computer: "Middle is 0"
    }
  }
};

let foundClues = [];

/* GET CLUES */
function getClue(item) {
  let clue = levels[level].clues[item];

  if (!foundClues.includes(item)) {
    foundClues.push(item);
    document.getElementById("message").innerText = clue;
  } else {
    document.getElementById("message").innerText = "Already checked.";
  }
}

/* SUBMIT CODE */
function submitCode() {
  let input = document.getElementById("code").value;

  if (input === levels[level].code) {
    document.getElementById("message").innerText = "DOOR UNLOCKED";
    document.querySelector(".door").innerText = "OPEN";
    document.querySelector(".door").style.background = "green";
  } else {
    document.getElementById("message").innerText = "Wrong code";
  }
}

/* GO THROUGH DOOR */
function checkDoor() {
  if (document.querySelector(".door").innerText === "OPEN") {

    level++;

    if (level > 4) {
      document.body.innerHTML = `
        <h1 style="text-align:center;margin-top:40vh;">
          YOU ESCAPED ALL ROOMS 🎉
        </h1>
      `;
      return;
    }

    /* RESET ROOM FOR NEXT LEVEL */
    document.getElementById("level").innerText = level;
    document.getElementById("code").value = "";
    document.getElementById("message").innerText = "";

    document.querySelector(".door").innerText = "LOCKED";
    document.querySelector(".door").style.background = "#111";

    foundClues = [];
  } else {
    document.getElementById("message").innerText = "Door is locked";
  }
}