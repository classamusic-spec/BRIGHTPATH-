/**
 * Talk board vocabulary (AAC). A fixed Core board comes first (words keep
 * their place so hands can learn where they are), then topic categories with
 * subcategories. Every card has a picture, a word and the words spoken aloud.
 *
 * Colours follow a Modified Fitzgerald Key so word types are recognisable at
 * a glance: people yellow, actions green, describing blue, things orange,
 * social pink, questions purple, "not"/"stop" coral, little words grey.
 *
 * Pictures are Fluent Emoji (MIT, Microsoft) rendered to PNG by
 * scripts/build-talk-symbols.mjs, which reads the symbol names in this file.
 * Keep every symbol as the second quoted argument of a helper call.
 */
import { GUIDE } from './cast';
import type { SymbolId } from './talkSymbols';

export type WordClass = 'people' | 'action' | 'describe' | 'thing' | 'social' | 'question' | 'negation' | 'little';

export interface TalkCard {
  id: string;
  /** Word or short phrase shown on the card. */
  label: string;
  /** What the voice says (defaults to the label). */
  say: string;
  symbol: SymbolId;
  cls: WordClass;
}

export interface TalkSubcategory {
  id: string;
  label: string;
  symbol: SymbolId;
  cards: TalkCard[];
}

export interface TalkCategory {
  id: string;
  label: string;
  symbol: SymbolId;
  subcategories: TalkSubcategory[];
}

type Draft = Omit<TalkCard, 'id'>;
const mk =
  (cls: WordClass) =>
  (label: string, symbol: SymbolId, say?: string): Draft => ({ label, symbol, cls, say: say ?? label });

/** people · action · describe · thing · social · question · not/stop · little words */
const p = mk('people');
const a = mk('action');
const d = mk('describe');
const t = mk('thing');
const s = mk('social');
const q = mk('question');
const n = mk('negation');
const l = mk('little');

const slug = (x: string) =>
  x
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** `{guide}` in a label becomes the guide's name; the card id keeps the placeholder so it survives a rename. */
const named = (x: string) => x.replace('{guide}', GUIDE.name);

function sub(id: string, label: string, symbol: SymbolId, drafts: Draft[]): TalkSubcategory {
  return { id, label, symbol, cards: drafts.map((c) => ({ ...c, label: named(c.label), say: named(c.say), id: `${id}.${slug(c.label)}` })) };
}

function cat(id: string, label: string, symbol: SymbolId, subcategories: TalkSubcategory[]): TalkCategory {
  return { id, label, symbol, subcategories };
}

/**
 * Always on screen, above everything else: the fastest way to say the most
 * important things. Full phrases, because speed matters most here.
 */
export const QUICK_CARDS: TalkCard[] = sub('quick', 'Quick', 'speech-balloon', [
  s('yes', 'check-mark-button', 'Yes'),
  n('no', 'person-gesturing-no', 'No'),
  a('help me', 'raised-hand', 'Help me, please'),
  t('bathroom', 'toilet', 'I need the bathroom'),
  a('break', 'pause-button', 'I need a break'),
  d('hurt', 'face-with-head-bandage', 'I’m hurt'),
  n('stop', 'stop-sign', 'Stop, please'),
  s('all done', 'chequered-flag', 'All done'),
]).cards;

/**
 * Core words (Project Core-style): the small set of words that makes up most
 * of what we say. Order is fixed so each word keeps its place.
 */
const CORE = cat('core', 'Core', 'speech-balloon', [
  sub('core', 'Core words', 'speech-balloon', [
    p('I', 'person-raising-hand'),
    p('you', 'index-pointing-at-the-viewer'),
    a('want', 'palms-up-together'),
    a('like', 'thumbs-up'),
    a('need', 'red-exclamation-mark'),
    a('feel', 'beating-heart'),
    a('go', 'green-circle'),
    n('stop', 'stop-sign'),
    a('help', 'raised-hand'),
    d('more', 'plus'),
    s('all done', 'chequered-flag'),
    d('again', 'repeat-button'),
    a('eat', 'fork-and-knife-with-plate'),
    a('drink', 'cup-with-straw'),
    a('play', 'playground-slide'),
    a('look', 'eyes'),
    a('make', 'hammer-and-wrench'),
    a('turn', 'counterclockwise-arrows-button'),
    a('open', 'unlocked'),
    a('put', 'inbox-tray'),
    l('up', 'up-arrow'),
    l('down', 'down-arrow'),
    l('that', 'backhand-index-pointing-right'),
    l('here', 'backhand-index-pointing-down'),
    d('big', 'large-blue-diamond'),
    d('little', 'small-blue-diamond'),
    d('same', 'heavy-equals-sign'),
    d('different', 'shuffle-tracks-button'),
    d('good', 'glowing-star'),
    n('not', 'prohibited'),
    q('what', 'red-question-mark'),
    q('where', 'round-pushpin'),
    q('who', 'bust-in-silhouette'),
    q('when', 'alarm-clock'),
    q('why', 'thinking-face'),
    q('how', 'gear'),
  ]),
]);

const FEELINGS = cat('feelings', 'Feelings', 'smiling-face-with-smiling-eyes', [
  sub('feelings', 'Feelings', 'smiling-face-with-smiling-eyes', [
    d('happy', 'grinning-face-with-big-eyes'),
    d('sad', 'crying-face'),
    d('angry', 'pouting-face'),
    d('scared', 'fearful-face'),
    d('worried', 'worried-face'),
    d('excited', 'star-struck'),
    d('calm', 'relieved-face'),
    d('tired', 'yawning-face'),
    d('silly', 'zany-face'),
    d('loved', 'smiling-face-with-hearts'),
    d('proud', 'smiling-face-with-sunglasses'),
    d('frustrated', 'confounded-face'),
    d('surprised', 'astonished-face'),
    d('shy', 'flushed-face'),
    d('confused', 'confused-face'),
    d('bored', 'unamused-face'),
    d('lonely', 'pensive-face'),
    d('nervous', 'anxious-face-with-sweat'),
    d('okay', 'slightly-smiling-face'),
    d('grumpy', 'face-with-steam-from-nose'),
  ]),
  sub('body-feels', 'My body feels', 'face-with-thermometer', [
    d('hurt', 'face-with-head-bandage'),
    d('sick', 'face-with-thermometer'),
    d('hungry', 'face-savoring-food'),
    d('thirsty', 'droplet'),
    d('sleepy', 'sleeping-face'),
    d('hot', 'hot-face'),
    d('cold', 'cold-face'),
    d('dizzy', 'face-with-spiral-eyes'),
    d('tummy ache', 'nauseated-face'),
    d('too loud', 'speaker-high-volume'),
    d('too bright', 'sun'),
    d('itchy', 'lotion-bottle'),
    d('full', 'face-exhaling'),
    d('wiggly', 'person-cartwheeling'),
  ]),
  sub('calm-tools', 'Calm tools', 'person-in-lotus-position', [
    a('deep breath', 'wind-face'),
    a('break', 'pause-button'),
    a('hug', 'people-hugging'),
    d('quiet', 'shushing-face'),
    a('walk', 'person-walking'),
    t('music', 'musical-notes'),
    t('headphones', 'headphone'),
    t('water', 'droplet'),
    a('count to ten', 'keycap-10'),
    a('squeeze', 'raised-fist'),
    t('bubbles', 'bubbles'),
    a('stretch', 'person-in-lotus-position'),
    t('blanket', 'bed'),
    t('my space', 'house-with-garden'),
  ]),
]);

const FOOD = cat('food', 'Food', 'red-apple', [
  sub('fruit', 'Fruit', 'red-apple', [
    t('apple', 'red-apple'),
    t('banana', 'banana'),
    t('grapes', 'grapes'),
    t('strawberry', 'strawberry'),
    t('orange', 'tangerine'),
    t('watermelon', 'watermelon'),
    t('pear', 'pear'),
    t('peach', 'peach'),
    t('blueberries', 'blueberries'),
    t('pineapple', 'pineapple'),
    t('cherries', 'cherries'),
    t('mango', 'mango'),
    t('kiwi', 'kiwi-fruit'),
    t('lemon', 'lemon'),
    t('melon', 'melon'),
    t('coconut', 'coconut'),
    t('green apple', 'green-apple'),
  ]),
  sub('vegetables', 'Vegetables', 'broccoli', [
    t('carrot', 'carrot'),
    t('broccoli', 'broccoli'),
    t('corn', 'ear-of-corn'),
    t('cucumber', 'cucumber'),
    t('tomato', 'tomato'),
    t('potato', 'potato'),
    t('peas', 'pea-pod'),
    t('lettuce', 'leafy-green'),
    t('pepper', 'bell-pepper'),
    t('avocado', 'avocado'),
    t('mushroom', 'mushroom'),
    t('onion', 'onion'),
    t('beans', 'beans'),
    t('eggplant', 'eggplant'),
    t('sweet potato', 'roasted-sweet-potato'),
    t('garlic', 'garlic'),
  ]),
  sub('breakfast', 'Breakfast', 'pancakes', [
    t('pancakes', 'pancakes'),
    t('waffle', 'waffle'),
    t('egg', 'cooking'),
    t('cereal', 'bowl-with-spoon'),
    t('toast', 'bread'),
    t('bagel', 'bagel'),
    t('bacon', 'bacon'),
    t('croissant', 'croissant'),
    t('butter', 'butter'),
    t('boiled egg', 'egg'),
  ]),
  sub('meals', 'Lunch & dinner', 'spaghetti', [
    t('sandwich', 'sandwich'),
    t('pizza', 'pizza'),
    t('pasta', 'spaghetti'),
    t('rice', 'cooked-rice'),
    t('chicken', 'poultry-leg'),
    t('burger', 'hamburger'),
    t('hot dog', 'hot-dog'),
    t('taco', 'taco'),
    t('burrito', 'burrito'),
    t('soup', 'pot-of-food'),
    t('noodles', 'steaming-bowl'),
    t('sushi', 'sushi'),
    t('salad', 'green-salad'),
    t('fries', 'french-fries'),
    t('dumplings', 'dumpling'),
    t('meat', 'cut-of-meat'),
    t('shrimp', 'fried-shrimp'),
    t('curry', 'curry-rice'),
    t('flatbread', 'stuffed-flatbread'),
    t('falafel', 'falafel'),
  ]),
  sub('snacks', 'Snacks & treats', 'cookie', [
    t('cookie', 'cookie'),
    t('popcorn', 'popcorn'),
    t('pretzel', 'pretzel'),
    t('cheese', 'cheese-wedge'),
    t('crackers', 'rice-cracker'),
    t('ice cream', 'soft-ice-cream'),
    t('cake', 'shortcake'),
    t('cupcake', 'cupcake'),
    t('doughnut', 'doughnut'),
    t('candy', 'candy'),
    t('chocolate', 'chocolate-bar'),
    t('lollipop', 'lollipop'),
    t('pie', 'pie'),
    t('honey', 'honey-pot'),
    t('peanuts', 'peanuts'),
    t('pudding', 'custard'),
    t('birthday cake', 'birthday-cake'),
  ]),
  sub('drinks', 'Drinks', 'glass-of-milk', [
    t('water', 'droplet'),
    t('milk', 'glass-of-milk'),
    t('juice', 'beverage-box'),
    t('hot chocolate', 'hot-beverage'),
    t('tea', 'teacup-without-handle'),
    t('smoothie', 'bubble-tea'),
    t('bottle', 'baby-bottle'),
    t('ice', 'ice'),
    t('drink', 'cup-with-straw'),
  ]),
  sub('eating-things', 'Eating things', 'fork-and-knife-with-plate', [
    t('plate', 'fork-and-knife-with-plate'),
    t('bowl', 'bowl-with-spoon'),
    t('spoon', 'spoon'),
    t('fork', 'fork-and-knife'),
    t('chopsticks', 'chopsticks'),
    t('cup', 'teacup-without-handle'),
    t('lunchbox', 'bento-box'),
    t('salt', 'salt'),
    t('napkin', 'roll-of-paper'),
    d('yummy', 'face-savoring-food'),
    d('yucky', 'nauseated-face'),
    d('more please', 'plus', 'more, please'),
  ]),
]);

const PLAY = cat('play', 'Play', 'teddy-bear', [
  sub('toys', 'Toys', 'teddy-bear', [
    t('teddy bear', 'teddy-bear'),
    t('ball', 'softball'),
    t('blocks', 'brick'),
    t('doll', 'nesting-dolls'),
    t('car', 'racing-car'),
    t('train', 'locomotive'),
    t('robot', 'robot'),
    t('kite', 'kite'),
    t('yo-yo', 'yo-yo'),
    t('puzzle', 'puzzle-piece'),
    t('balloon', 'balloon'),
    t('bubbles', 'bubbles'),
    t('dinosaur', 't-rex'),
    t('magic wand', 'magic-wand'),
    t('rocket', 'rocket'),
    t('marbles', 'crystal-ball'),
    t('horse', 'carousel-horse'),
    t('toy box', 'package'),
  ]),
  sub('games', 'Games', 'game-die', [
    t('board game', 'game-die'),
    t('cards', 'joker'),
    t('video game', 'video-game'),
    t('hide and seek', 'see-no-evil-monkey'),
    t('tag', 'person-running'),
    t('bowling', 'bowling'),
    t('chess', 'chess-pawn'),
    t('pretend', 'performing-arts'),
    t('dress up', 'crown'),
    t('tickles', 'face-with-tears-of-joy'),
    t('peekaboo', 'face-with-peeking-eye'),
    t('treasure hunt', 'world-map'),
  ]),
  sub('outside', 'Outside', 'playground-slide', [
    t('slide', 'playground-slide'),
    t('bike', 'bicycle'),
    t('scooter', 'kick-scooter'),
    t('skateboard', 'skateboard'),
    t('sand', 'beach-with-umbrella'),
    t('swimming', 'person-swimming'),
    t('soccer', 'soccer-ball'),
    t('basketball', 'basketball'),
    t('baseball', 'baseball'),
    t('tennis', 'tennis'),
    t('frisbee', 'flying-disc'),
    t('running', 'person-running'),
    t('climbing', 'person-climbing'),
    t('snowman', 'snowman'),
    t('picnic', 'basket'),
    t('garden', 'seedling'),
    t('water play', 'water-pistol'),
    t('bugs', 'lady-beetle'),
  ]),
  sub('arts', 'Arts & crafts', 'artist-palette', [
    a('draw', 'pencil'),
    a('paint', 'artist-palette'),
    t('crayons', 'crayon'),
    a('cut', 'scissors'),
    t('paper', 'page-facing-up'),
    t('stickers', 'star'),
    t('glitter', 'sparkles'),
    t('yarn', 'yarn'),
    t('sewing', 'sewing-needle'),
    a('build', 'building-construction'),
    t('paintbrush', 'paintbrush'),
    t('rainbow', 'rainbow'),
  ]),
  sub('music-screens', 'Music & screens', 'musical-notes', [
    t('music', 'musical-notes'),
    a('sing', 'microphone'),
    a('dance', 'mirror-ball'),
    t('drum', 'drum'),
    t('guitar', 'guitar'),
    t('piano', 'musical-keyboard'),
    t('trumpet', 'trumpet'),
    t('violin', 'violin'),
    t('headphones', 'headphone'),
    t('TV', 'television'),
    t('tablet', 'mobile-phone'),
    t('movie', 'clapper-board'),
    t('camera', 'camera'),
    t('book', 'open-book'),
  ]),
]);

const PEOPLE = cat('people', 'People', 'people-hugging', [
  sub('me-you', 'Me & you', 'person-raising-hand', [
    p('I', 'person-raising-hand'),
    p('me', 'person-raising-hand'),
    p('you', 'index-pointing-at-the-viewer'),
    p('we', 'people-hugging'),
    p('he', 'boy'),
    p('she', 'girl'),
    p('they', 'busts-in-silhouette'),
    p('my', 'person-tipping-hand'),
    p('your', 'index-pointing-at-the-viewer'),
    p('everyone', 'raising-hands'),
  ]),
  sub('family', 'Family', 'people-hugging', [
    p('mom', 'woman'),
    p('dad', 'man'),
    p('grown-up', 'person'),
    p('baby', 'baby'),
    p('brother', 'boy'),
    p('sister', 'girl'),
    p('grandma', 'old-woman'),
    p('grandpa', 'old-man'),
    p('cousin', 'child'),
    p('family', 'people-hugging'),
    p('pet', 'paw-prints'),
  ]),
  sub('helpers', 'School & helpers', 'teacher', [
    p('teacher', 'teacher'),
    p('friend', 'handshake'),
    p('classmates', 'children-crossing'),
    p('doctor', 'health-worker'),
    p('dentist', 'tooth'),
    p('police', 'police-officer'),
    p('firefighter', 'firefighter'),
    p('cook', 'cook'),
    p('farmer', 'farmer'),
    p('helper', 'person-superhero'),
    p('student', 'student'),
    p('artist', 'artist'),
    p('pilot', 'pilot'),
    p('astronaut', 'astronaut'),
  ]),
  sub('buddies', 'My buddies', 'fox', [
    p('{guide}', 'fox'),
    p('Pip', 'penguin'),
    p('Tilly', 'turtle'),
    p('Roo', 'dog-face'),
  ]),
]);

const PLACES = cat('places', 'Places', 'house', [
  sub('home', 'Home', 'house', [
    t('home', 'house'),
    t('bedroom', 'bed'),
    t('bathroom', 'toilet'),
    t('bath', 'bathtub'),
    t('kitchen', 'cooking'),
    t('living room', 'couch-and-lamp'),
    t('backyard', 'deciduous-tree'),
    t('my room', 'teddy-bear'),
    t('door', 'door'),
    t('window', 'window'),
  ]),
  sub('school', 'School', 'school', [
    t('school', 'school'),
    t('playground', 'playground-slide'),
    t('library', 'books'),
    t('gym', 'basketball'),
    t('lunchroom', 'bento-box'),
    t('music room', 'musical-notes'),
    t('art room', 'artist-palette'),
    t('classroom', 'pencil'),
    t('bus stop', 'bus-stop'),
  ]),
  sub('out', 'Out & about', 'national-park', [
    t('park', 'national-park'),
    t('store', 'shopping-cart'),
    t('restaurant', 'fork-and-knife-with-plate'),
    t('doctor’s office', 'hospital'),
    t('beach', 'beach-with-umbrella'),
    t('pool', 'person-swimming'),
    t('zoo', 'zebra'),
    t('farm', 'tractor'),
    t('movies', 'cinema'),
    t('friend’s house', 'house-with-garden'),
    t('camping', 'camping'),
    t('airport', 'airplane-departure'),
    t('museum', 'classical-building'),
    t('party', 'party-popper'),
    t('car', 'automobile'),
    t('outside', 'deciduous-tree'),
  ]),
]);

const ACTIONS = cat('actions', 'Actions', 'person-running', [
  sub('everyday', 'Every day', 'toothbrush', [
    a('eat', 'fork-and-knife-with-plate'),
    a('drink', 'cup-with-straw'),
    a('sleep', 'sleeping-face'),
    a('wash hands', 'soap'),
    a('brush teeth', 'toothbrush'),
    a('take a bath', 'bathtub'),
    a('shower', 'shower'),
    a('get dressed', 't-shirt'),
    a('go potty', 'toilet'),
    a('clean up', 'broom'),
    a('cook', 'cooking'),
    a('wake up', 'alarm-clock'),
    a('go to bed', 'bed'),
    a('put on shoes', 'running-shoe'),
    a('comb hair', 'person-getting-haircut'),
  ]),
  sub('move', 'Move', 'person-running', [
    a('walk', 'person-walking'),
    a('run', 'person-running'),
    a('sit', 'chair'),
    a('stand', 'person-standing'),
    a('dance', 'woman-dancing'),
    a('swim', 'person-swimming'),
    a('climb', 'person-climbing'),
    a('ride', 'person-biking'),
    a('throw', 'person-playing-handball'),
    a('bounce', 'person-bouncing-ball'),
    a('stretch', 'person-in-lotus-position'),
    a('roll', 'person-cartwheeling'),
    a('kneel', 'person-kneeling'),
    a('wave', 'waving-hand'),
    a('clap', 'clapping-hands'),
    a('kick', 'soccer-ball'),
  ]),
  sub('do', 'Do & make', 'hammer-and-wrench', [
    a('look', 'eyes'),
    a('listen', 'ear'),
    a('talk', 'speaking-head'),
    a('sing', 'microphone'),
    a('read', 'open-book'),
    a('write', 'writing-hand'),
    a('draw', 'pencil'),
    a('paint', 'artist-palette'),
    a('build', 'building-construction'),
    a('cut', 'scissors'),
    a('open', 'unlocked'),
    a('close', 'locked'),
    a('give', 'wrapped-gift'),
    a('share', 'handshake'),
    a('help', 'raised-hand'),
    a('wait', 'hourglass-not-done'),
    a('find', 'magnifying-glass-tilted-left'),
    a('hug', 'people-hugging'),
    a('call', 'telephone-receiver'),
    a('fix', 'wrench'),
    a('throw away', 'wastebasket'),
    a('turn on', 'light-bulb'),
    a('think', 'thinking-face'),
    a('play', 'playground-slide'),
    a('make', 'hammer-and-wrench'),
    a('get', 'palm-up-hand'),
  ]),
]);

const BODY = cat('body', 'Body', 'flexed-biceps', [
  sub('parts', 'Body parts', 'flexed-biceps', [
    t('head', 'bust-in-silhouette'),
    t('eyes', 'eyes'),
    t('ears', 'ear'),
    t('nose', 'nose'),
    t('mouth', 'mouth'),
    t('teeth', 'tooth'),
    t('tongue', 'tongue'),
    t('hair', 'person-getting-haircut'),
    t('hand', 'hand-with-fingers-splayed'),
    t('arm', 'flexed-biceps'),
    t('leg', 'leg'),
    t('foot', 'foot'),
    t('finger', 'index-pointing-up'),
    t('heart', 'anatomical-heart'),
    t('brain', 'brain'),
    t('bones', 'bone'),
  ]),
  sub('health', 'Health & care', 'adhesive-bandage', [
    t('bathroom', 'toilet'),
    d('hurt', 'face-with-head-bandage'),
    d('sick', 'face-with-thermometer'),
    t('medicine', 'pill'),
    t('bandage', 'adhesive-bandage'),
    p('doctor', 'health-worker'),
    t('tissue', 'roll-of-paper'),
    a('sneeze', 'sneezing-face'),
    a('cough', 'face-with-medical-mask'),
    a('throw up', 'face-vomiting'),
    t('glasses', 'glasses'),
    t('hearing aid', 'ear-with-hearing-aid'),
    t('wheelchair', 'manual-wheelchair'),
    t('crutch', 'crutch'),
    t('soap', 'soap'),
    t('toothbrush', 'toothbrush'),
    t('lotion', 'lotion-bottle'),
    t('shot', 'syringe'),
  ]),
]);

const CLOTHES = cat('clothes', 'Clothes', 't-shirt', [
  sub('wear', 'Clothes', 't-shirt', [
    t('shirt', 't-shirt'),
    t('pants', 'jeans'),
    t('shorts', 'shorts'),
    t('dress', 'dress'),
    t('coat', 'coat'),
    t('socks', 'socks'),
    t('underwear', 'briefs'),
    t('swimsuit', 'one-piece-swimsuit'),
    t('sports shirt', 'running-shirt'),
    t('kimono', 'kimono'),
    t('sari', 'sari'),
    t('lab coat', 'lab-coat'),
  ]),
  sub('shoes-hats', 'Shoes & hats', 'running-shoe', [
    t('shoes', 'running-shoe'),
    t('boots', 'hiking-boot'),
    t('sandals', 'womans-sandal'),
    t('flip-flops', 'thong-sandal'),
    t('dance shoes', 'ballet-shoes'),
    t('cap', 'billed-cap'),
    t('hat', 'womans-hat'),
    t('top hat', 'top-hat'),
    t('crown', 'crown'),
  ]),
  sub('extras', 'Extras', 'backpack', [
    t('gloves', 'gloves'),
    t('scarf', 'scarf'),
    t('glasses', 'glasses'),
    t('sunglasses', 'sunglasses'),
    t('backpack', 'backpack'),
    t('umbrella', 'umbrella'),
    t('bow', 'ribbon'),
    t('watch', 'watch'),
    t('bag', 'handbag'),
    t('goggles', 'goggles'),
  ]),
]);

const ANIMALS = cat('animals', 'Animals', 'dog-face', [
  sub('pets', 'Pets', 'dog-face', [
    t('dog', 'dog-face'),
    t('cat', 'cat-face'),
    t('fish', 'tropical-fish'),
    t('bird', 'bird'),
    t('bunny', 'rabbit-face'),
    t('hamster', 'hamster'),
    t('turtle', 'turtle'),
    t('parrot', 'parrot'),
    t('mouse', 'mouse-face'),
  ]),
  sub('farm', 'Farm', 'cow-face', [
    t('cow', 'cow-face'),
    t('pig', 'pig-face'),
    t('sheep', 'ewe'),
    t('chicken', 'chicken'),
    t('duck', 'duck'),
    t('goat', 'goat'),
    t('horse', 'horse-face'),
    t('donkey', 'donkey'),
    t('rooster', 'rooster'),
    t('chick', 'baby-chick'),
  ]),
  sub('wild', 'Wild', 'lion', [
    t('lion', 'lion'),
    t('tiger', 'tiger-face'),
    t('elephant', 'elephant'),
    t('giraffe', 'giraffe'),
    t('monkey', 'monkey-face'),
    t('bear', 'bear'),
    t('zebra', 'zebra'),
    t('panda', 'panda'),
    t('fox', 'fox'),
    t('owl', 'owl'),
    t('deer', 'deer'),
    t('kangaroo', 'kangaroo'),
    t('koala', 'koala'),
    t('hippo', 'hippopotamus'),
    t('crocodile', 'crocodile'),
    t('snake', 'snake'),
    t('dinosaur', 'sauropod'),
    t('unicorn', 'unicorn'),
  ]),
  sub('sea-bugs', 'Sea & bugs', 'spouting-whale', [
    t('whale', 'spouting-whale'),
    t('dolphin', 'dolphin'),
    t('shark', 'shark'),
    t('octopus', 'octopus'),
    t('crab', 'crab'),
    t('jellyfish', 'jellyfish'),
    t('seal', 'seal'),
    t('penguin', 'penguin'),
    t('butterfly', 'butterfly'),
    t('bee', 'honeybee'),
    t('ladybug', 'lady-beetle'),
    t('snail', 'snail'),
    t('ant', 'ant'),
    t('caterpillar', 'bug'),
    t('worm', 'worm'),
    t('frog', 'frog'),
    t('spider', 'spider'),
  ]),
]);

const DESCRIBE = cat('describe', 'Describe', 'rainbow', [
  sub('size', 'Size & amount', 'large-blue-diamond', [
    d('big', 'large-blue-diamond'),
    d('little', 'small-blue-diamond'),
    d('more', 'plus'),
    d('less', 'minus'),
    d('all', 'hundred-points'),
    d('some', 'pinching-hand'),
    d('empty', 'wastebasket'),
    d('full', 'battery'),
    d('tall', 'giraffe'),
    d('long', 'straight-ruler'),
    d('heavy', 'person-lifting-weights'),
    d('lots', 'books'),
  ]),
  sub('senses', 'Feel & sense', 'fire', [
    d('hot', 'fire'),
    d('cold', 'ice'),
    d('wet', 'droplet'),
    d('soft', 'cloud'),
    d('hard', 'rock'),
    d('loud', 'loudspeaker'),
    d('quiet', 'shushing-face'),
    d('fast', 'high-voltage'),
    d('slow', 'snail'),
    d('yummy', 'face-savoring-food'),
    d('yucky', 'nauseated-face'),
    d('clean', 'sparkles'),
    d('bright', 'sun'),
    d('dark', 'new-moon'),
    d('broken', 'broken-chain'),
    d('new', 'new-button'),
  ]),
  sub('colors', 'Colors', 'artist-palette', [
    d('red', 'red-square'),
    d('orange', 'orange-square'),
    d('yellow', 'yellow-square'),
    d('green', 'green-square'),
    d('blue', 'blue-square'),
    d('purple', 'purple-square'),
    d('pink', 'pink-heart'),
    d('brown', 'brown-square'),
    d('black', 'black-large-square'),
    d('white', 'white-large-square'),
    d('gray', 'grey-heart'),
    d('rainbow', 'rainbow'),
  ]),
  sub('shapes-numbers', 'Shapes & numbers', 'keycap-1', [
    d('circle', 'blue-circle'),
    d('square', 'blue-square'),
    d('triangle', 'red-triangle'),
    d('star', 'star'),
    d('heart', 'red-heart'),
    d('diamond', 'large-orange-diamond'),
    d('one', 'keycap-1'),
    d('two', 'keycap-2'),
    d('three', 'keycap-3'),
    d('four', 'keycap-4'),
    d('five', 'keycap-5'),
    d('six', 'keycap-6'),
    d('seven', 'keycap-7'),
    d('eight', 'keycap-8'),
    d('nine', 'keycap-9'),
    d('ten', 'keycap-10'),
    d('zero', 'keycap-0'),
  ]),
]);

const TIME = cat('time', 'Time & weather', 'sun-behind-small-cloud', [
  sub('time', 'Time', 'alarm-clock', [
    l('now', 'alarm-clock'),
    l('later', 'hourglass-not-done'),
    l('today', 'calendar'),
    l('tomorrow', 'tear-off-calendar'),
    l('yesterday', 'spiral-calendar'),
    l('morning', 'sunrise'),
    l('afternoon', 'sun'),
    l('evening', 'sunset'),
    l('night', 'crescent-moon'),
    t('bedtime', 'bed'),
    t('weekend', 'beach-with-umbrella'),
    t('birthday', 'birthday-cake'),
    t('holiday', 'party-popper'),
    l('first', '1st-place-medal'),
    l('next', 'right-arrow'),
    l('last', 'chequered-flag'),
    l('soon', 'soon-arrow'),
  ]),
  sub('weather', 'Weather', 'sun-behind-small-cloud', [
    d('sunny', 'sun'),
    d('cloudy', 'cloud'),
    d('rainy', 'cloud-with-rain'),
    d('snowy', 'cloud-with-snow'),
    d('windy', 'wind-face'),
    d('stormy', 'cloud-with-lightning-and-rain'),
    t('rainbow', 'rainbow'),
    d('hot', 'hot-face'),
    d('cold', 'cold-face'),
    d('foggy', 'fog'),
    t('umbrella', 'umbrella-with-rain-drops'),
    t('snowflake', 'snowflake'),
  ]),
  sub('seasons', 'Seasons', 'fallen-leaf', [
    t('spring', 'cherry-blossom'),
    t('summer', 'sun-with-face'),
    t('fall', 'fallen-leaf'),
    t('winter', 'snowman'),
  ]),
]);

const SCHOOL = cat('school', 'School', 'school', [
  sub('school-things', 'School things', 'pencil', [
    t('pencil', 'pencil'),
    t('crayon', 'crayon'),
    t('scissors', 'scissors'),
    t('paper', 'page-facing-up'),
    t('book', 'closed-book'),
    t('notebook', 'notebook'),
    t('backpack', 'backpack'),
    t('computer', 'laptop'),
    t('ruler', 'straight-ruler'),
    t('paintbrush', 'paintbrush'),
    t('lunchbox', 'bento-box'),
    t('glue', 'test-tube'),
    t('globe', 'globe-showing-americas'),
    t('calculator', 'abacus'),
  ]),
  sub('school-time', 'At school', 'open-book', [
    t('reading', 'open-book'),
    t('writing', 'writing-hand'),
    t('math', 'input-numbers'),
    t('science', 'microscope'),
    t('art', 'artist-palette'),
    t('music', 'musical-notes'),
    t('gym', 'basketball'),
    t('recess', 'playground-slide'),
    t('lunch', 'bento-box'),
    t('story time', 'books'),
    t('computer time', 'laptop'),
    t('show and tell', 'teddy-bear'),
    t('line up', 'footprints'),
    t('field trip', 'bus'),
    t('circle time', 'children-crossing'),
  ]),
  sub('classroom', 'Classroom words', 'teacher', [
    p('teacher', 'teacher'),
    p('friend', 'handshake'),
    d('quiet', 'shushing-face'),
    s('finished', 'chequered-flag'),
    s('my turn', 'index-pointing-up'),
    s('your turn', 'backhand-index-pointing-right'),
    a('I don’t understand', 'confused-face'),
    a('I need help', 'raised-hand'),
    a('can I go', 'green-circle', 'Can I go?'),
    a('show me', 'eyes'),
  ]),
]);

const CHAT = cat('chat', 'Chat', 'waving-hand', [
  sub('hello', 'Hello & manners', 'waving-hand', [
    s('hi', 'waving-hand'),
    s('bye', 'hand-with-fingers-splayed'),
    s('please', 'folded-hands'),
    s('thank you', 'smiling-face-with-hearts'),
    s('sorry', 'pensive-face', 'I’m sorry'),
    s('excuse me', 'person-tipping-hand'),
    s('you’re welcome', 'slightly-smiling-face'),
    s('good morning', 'sunrise'),
    s('good night', 'crescent-moon'),
    s('I love you', 'love-you-gesture'),
    s('how are you', 'grinning-face-with-big-eyes', 'How are you?'),
    s('nice to meet you', 'handshake'),
  ]),
  sub('talking', 'Talking', 'speech-balloon', [
    s('yes', 'check-mark-button'),
    n('no', 'person-gesturing-no'),
    s('maybe', 'person-shrugging'),
    s('I don’t know', 'person-shrugging'),
    s('I like it', 'thumbs-up'),
    n('I don’t like it', 'thumbs-down'),
    s('wait', 'hourglass-not-done'),
    s('look at me', 'eyes'),
    s('listen', 'ear'),
    s('that’s funny', 'face-with-tears-of-joy'),
    s('cool', 'smiling-face-with-sunglasses'),
    s('wow', 'star-struck'),
    s('oops', 'grimacing-face'),
    s('good job', 'clapping-hands'),
    s('high five', 'raising-hands'),
    s('I’m okay', 'ok-hand'),
  ]),
  sub('turns', 'Turns & play', 'index-pointing-up', [
    s('my turn', 'index-pointing-up'),
    s('your turn', 'backhand-index-pointing-right'),
    s('let’s play', 'playground-slide'),
    s('can I play', 'teddy-bear', 'Can I play?'),
    s('share', 'handshake'),
    s('again', 'repeat-button'),
    s('come here', 'backhand-index-pointing-down'),
    s('watch me', 'eyes'),
    n('stop it', 'stop-sign'),
    n('go away', 'no-entry'),
    n('leave me alone', 'person-gesturing-no'),
    s('quiet please', 'shushing-face'),
  ]),
  sub('questions', 'Questions', 'red-question-mark', [
    q('what', 'red-question-mark'),
    q('where', 'round-pushpin'),
    q('who', 'bust-in-silhouette'),
    q('when', 'alarm-clock'),
    q('why', 'thinking-face'),
    q('how', 'gear'),
    q('what’s that', 'magnifying-glass-tilted-left', 'What’s that?'),
    q('where are we going', 'world-map', 'Where are we going?'),
    q('can I have', 'palms-up-together', 'Can I have?'),
    q('is it time', 'hourglass-not-done', 'Is it time?'),
  ]),
]);

const GOING = cat('going', 'Going', 'automobile', [
  sub('road', 'On the road', 'automobile', [
    t('car', 'automobile'),
    t('bus', 'bus'),
    t('taxi', 'taxi'),
    t('truck', 'delivery-truck'),
    t('pickup', 'pickup-truck'),
    t('motorcycle', 'motorcycle'),
    t('scooter', 'motor-scooter'),
    t('bike', 'bicycle'),
    t('tractor', 'tractor'),
    t('race car', 'racing-car'),
    t('walk', 'person-walking'),
    t('wheelchair', 'motorized-wheelchair'),
  ]),
  sub('rails-sky-water', 'Trains, sky & water', 'airplane', [
    t('train', 'locomotive'),
    t('fast train', 'bullet-train'),
    t('subway', 'metro'),
    t('tram', 'tram'),
    t('airplane', 'airplane'),
    t('helicopter', 'helicopter'),
    t('rocket', 'rocket'),
    t('boat', 'sailboat'),
    t('ship', 'passenger-ship'),
    t('speedboat', 'speedboat'),
  ]),
  sub('helpers-vehicles', 'Helper vehicles', 'fire-engine', [
    t('fire truck', 'fire-engine'),
    t('ambulance', 'ambulance'),
    t('police car', 'police-car'),
    t('road work', 'construction'),
  ]),
]);

/** Every category, in tab order. Core first so it is always one tap away. */
export const TALK_CATEGORIES: TalkCategory[] = [CORE, FEELINGS, FOOD, PLAY, PEOPLE, PLACES, ACTIONS, BODY, CLOTHES, ANIMALS, DESCRIBE, TIME, SCHOOL, CHAT, GOING];

/** Fitzgerald Key colours (fill and edge) per word type. */
export const WORD_CLASS_COLORS: Record<WordClass, { bg: string; edge: string; label: string }> = {
  people: { bg: '#FFF4D6', edge: '#F2B42C', label: 'People' },
  action: { bg: '#E3F6E9', edge: '#3BAE6A', label: 'Actions' },
  describe: { bg: '#E3EEFD', edge: '#3F7FE8', label: 'Describing' },
  thing: { bg: '#FEEDE1', edge: '#EE7A3B', label: 'Things & places' },
  social: { bg: '#FDE6EE', edge: '#E4588A', label: 'Social words' },
  question: { bg: '#EFE7FE', edge: '#8A5CE6', label: 'Questions' },
  negation: { bg: '#FDE4E4', edge: '#D9534F', label: 'Not & stop' },
  little: { bg: '#EEF1F7', edge: '#8793B5', label: 'Little words' },
};

export const ALL_TALK_CARDS: TalkCard[] = [...QUICK_CARDS, ...TALK_CATEGORIES.flatMap((c) => c.subcategories.flatMap((s) => s.cards))];

const BY_ID = new Map(ALL_TALK_CARDS.map((c) => [c.id, c]));

export function talkCardById(id: string): TalkCard | undefined {
  return BY_ID.get(id);
}
