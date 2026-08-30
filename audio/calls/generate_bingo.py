import os
from gtts import gTTS

# Create the folder if it doesn't exist
OUTPUT_DIR = "audio/calls"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# The 81 bingo calls
calls = {
    0: "Bogey nought. Number nought!",
    1: "Kelly's eye. Number one!",
    2: "One little duck. Number two!",
    3: "Cup of tea. Number three!",
    4: "Knock at the door. Number four!",
    5: "Man alive. Number five!",
    6: "Half a dozen. Number six!",
    7: "Lucky for some. Number seven!",
    8: "Garden gate. Number eight!",
    9: "Doctor's orders. Number nine!",
    10: "Downing Street. Number ten!",
    11: "Legs eleven. Number eleven!",
    12: "One dozen. Number twelve!",
    13: "Unlucky for some. Number thirteen!",
    14: "Valentine's Day. Number fourteen!",
    15: "Young and keen. Number fifteen!",
    16: "Sweet sixteen. Number sixteen!",
    17: "Dancing queen. Number seventeen!",
    18: "Key of the door. Number eighteen!",
    19: "Goodbye teens. Number nineteen!",
    20: "One score. Number twenty!",
    21: "Royal salute. Number twenty-one!",
    22: "Two little ducks. Number twenty-two!",
    23: "Thee and me. Number twenty-three!",
    24: "Two dozen. Number twenty-four!",
    25: "Duck and dive. Number twenty-five!",
    26: "Pick and mix. Number twenty-six!",
    27: "Gateway to heaven. Number twenty-seven!",
    28: "In a state. Number twenty-eight!",
    29: "Rise and shine. Number twenty-nine!",
    30: "Dirty Gertie. Number thirty!",
    31: "Get up and run. Number thirty-one!",
    32: "Buckle my shoe. Number thirty-two!",
    33: "All the threes. Number thirty-three!",
    34: "Ask for more. Number thirty-four!",
    35: "Jump and jive. Number thirty-five!",
    36: "Three dozen. Number thirty-six!",
    37: "More than eleven. Number thirty-seven!",
    38: "Christmas cake. Number thirty-eight!",
    39: "The thirty-nine steps. Number thirty-nine!",
    40: "Life begins. Number forty!",
    41: "Time for fun. Number forty-one!",
    42: "Winnie the Pooh. Number forty-two!",
    43: "Down on your knees. Number forty-three!",
    44: "Droopy drawers. Number forty-four!",
    45: "Halfway there. Number forty-five!",
    46: "Up to tricks. Number forty-six!",
    47: "Four and seven. Number forty-seven!",
    48: "Four dozen. Number forty-eight!",
    49: "P C. Number forty-nine!",
    50: "Bullseye. Number fifty!",
    51: "Tweak of the thumb. Number fifty-one!",
    52: "Danny La Rue. Number fifty-two!",
    53: "Stuck in the tree. Number fifty-three!",
    54: "Clean the floor. Number fifty-four!",
    55: "Snakes alive. Number fifty-five!",
    56: "Was she worth it? Number fifty-six!",
    57: "Heinz varieties. Number fifty-seven!",
    58: "Make them wait. Number fifty-eight!",
    59: "The Brighton line. Number fifty-nine!",
    60: "Grandma's getting frisky. Number sixty!",
    61: "Baker's bun. Number sixty-one!",
    62: "Tickety-boo. Number sixty-two!",
    63: "Tickle me. Number sixty-three!",
    64: "The Beatles. Number sixty-four!",
    65: "Old age pension. Number sixty-five!",
    66: "Clickety click. Number sixty-six!",
    67: "Stairway to heaven. Number sixty-seven!",
    68: "Pick a mate. Number sixty-eight!",
    69: "Either way up. Number sixty-nine!",
    70: "Three score and ten. Number seventy!",
    71: "Bang on the drum. Number seventy-one!",
    72: "Six dozen. Number seventy-two!",
    73: "Queen bee. Number seventy-three!",
    74: "Hit the floor. Number seventy-four!",
    75: "Strive and strive. Number seventy-five!",
    76: "Trombones. Number seventy-six!",
    77: "Sunset strip. Number seventy-seven!",
    78: "Heaven's gate. Number seventy-eight!",
    79: "One more time. Number seventy-nine!",
    80: "Gandhi's breakfast. Number eighty!"
}

print("Generating bingo calls...")

for number, text in calls.items():
    # Generate the speech using Google's UK English Male voice
    tts = gTTS(text, lang='en', tld='co.uk', slow=False)
    
    # Save it directly to the audio/calls folder
    file_path = os.path.join(OUTPUT_DIR, f"{number}.mp3")
    tts.save(file_path)
    print(f"Saved {number}.mp3")

print("\nAll done! Check your audio/calls folder.")