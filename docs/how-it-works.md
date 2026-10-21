<!-- Example words here are deliberately NOT puzzle answers (check pipeline/targets.txt before adding any). -->

## The game in one sentence

Every clue is one of the hidden word's *neighbors in meaning*. The first clue is a distant neighbor, and each wrong guess brings a closer one, until the last clue is the hidden word's very nearest neighbor.

But how does a computer know which words are "near" each other? That's the fun part.

## Words as places on a map

Nobody typed in a dictionary of meanings. Instead, a program read billions of words of ordinary text and noticed which words turn up in similar sentences. *"The ___ chased the ball"* could be *puppy* or *kitten*; it's rarely *van*. Linguists put it neatly: **you shall know a word by the company it keeps.**

From that, the program gives every word a position, like a place on a map. Words used in similar ways end up close together; unrelated words end up far apart.

<figure class="sketch">
<svg viewBox="0 0 360 200" role="img" aria-labelledby="sketch-title sketch-desc">
<title id="sketch-title">Illustration: a map of words</title>
<desc id="sketch-desc">A made-up two-dimensional map. Kitten, puppy, hamster and pony sit close together in one corner; van, scooter and lorry sit together in the opposite corner.</desc>
<g class="sketch-group"><circle cx="70" cy="60" r="4"/><circle cx="52" cy="92" r="4"/><circle cx="122" cy="72" r="4"/><circle cx="138" cy="104" r="4"/><circle cx="262" cy="142" r="4"/><circle cx="300" cy="118" r="4"/><circle cx="292" cy="166" r="4"/></g>
<g class="sketch-labels" font-size="13"><text x="78" y="56">kitten</text><text x="60" y="108">hamster</text><text x="130" y="68">puppy</text><text x="146" y="108">pony</text><text x="254" y="138" text-anchor="end">van</text><text x="308" y="114">lorry</text><text x="300" y="181">scooter</text></g>
<g class="sketch-notes" font-size="11"><text x="20" y="160">pets and young animals</text><text x="340" y="40" text-anchor="end">vehicles</text></g>
</svg>
<figcaption>An illustration, not real data: similar words cluster together.</figcaption>
</figure>

## Not 2 directions, but 300

A paper map has two directions: east–west and north–south. Two isn't nearly enough for language. *Puppy* is close to *kitten* (young animals), but also to *cute* (feelings) and *pony* (pets). So the program uses **300 directions** at once.

That means every word becomes a list of 300 numbers, something like:

> *puppy* → 0.21, −0.43, 0.08, 0.66, … (296 more)

That list is called the word's **embedding**. No single number means anything obvious on its own; meaning lives in the whole pattern. You can't picture 300 directions (nobody can), but a computer handles them as easily as two.

## Measuring closeness

Think of each word's list of numbers as an arrow pointing somewhere in that 300-direction space. Two words are close in meaning when their arrows **point the same way**.

The game measures this with a score from about −1 to 1, called *cosine similarity*:

- **near 1**: the arrows point almost the same way (*cello* and *viola*)
- **near 0**: unrelated (*cello* and *pudding*)

## Nearest neighbors

To make a puzzle, the computer takes the hidden word and scores every other word in its vocabulary against it, then sorts them from closest to farthest. Those are its **nearest neighbors**.

Your clues come from that list: the 30th-closest word first, then the 22nd, 16th, 11th, 7th, 4th, 2nd, and finally the closest of all. Before choosing, it throws out:

- giveaways, like plurals or words sharing the answer's root (*writers* for *writing*)
- very rare words and filler words (*really*, *which*)
- anything offensive, using a blocklist

## Hot and cold

When you guess a word that isn't the answer, the game ranks your guess against the answer the same way: out of about 27,800 common English words, how close is yours? Ranked in the top 10 is 🔥 *Hot*; top 100 is ☀️ *Warm*; and further out it cools to ❄️ *Cold*.

## Why it's sometimes weird

The map was learned from Wikipedia and news articles written up to about 2014, so it reflects how words were *used there*, which isn't always how you'd use them.

- **News habits leak in.** In news writing, *bitter* mostly appears in *bitter rivalry* and *bitter dispute*, so its neighbors are about fighting, not taste.
- **Opposites are neighbors.** *Win* and *lose*, *early* and *late*: opposites appear in the same kinds of sentences, so they land close together. That surprises almost everyone.
- **Data carries human bias.** Text written by people reflects people's prejudices, and a map learned from it does too. That's one reason the clues go through a blocklist and were reviewed by hand.

## Your puzzle's map

Here is a puzzle you've finished, with the answer and its eight clues. To draw it, the 300 directions are squeezed down to the 2 that spread these nine words out the most (a technique called *principal component analysis*). Squeezing loses information, so treat it as a sketch: words that look close here are usually close, but not always.

<div id="your-map" class="your-map"></div>

## It all runs in your browser

There's no server and no AI service behind the game. The puzzles and a compressed copy of the word map (96 numbers per word instead of 300, about 2.7 MB) are downloaded once, and every comparison happens on your device. Nothing you type is sent anywhere. Your stats are kept only in this browser.
