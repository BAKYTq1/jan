import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  FaHeart,
  FaMusic,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCommentAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaMapPin,
  FaCoffee,
  FaFilm,
  FaGift,
  FaStar,
} from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ru', ru);

const noTexts = [
  'Нет',
  'Точно нет?',
  'Серьёзно?',
  'Ну подумай ещё раз',
  'А если подумать?',
  'Последний шанс...',
  'Ты уверена?',
  'Ну пожалуйста',
];

const placeCards = [
  { value: 'Кафе / ужин', icon: <FaCoffee /> },
  { value: 'Кино', icon: <FaFilm /> },
  { value: 'Прогулка', icon: <FaMapPin /> },
  { value: 'Сюрприз', icon: <FaGift /> },
];

// ⚠️ Токен бота и chat_id зашиты в клиентском коде — их видно любому в devtools.
// С этим токеном можно слать сообщения от лица бота куда угодно.
// Правильный вариант — отправлять эти данные на свой бэкенд/serverless-функцию,
// а вызов Telegram API делать уже оттуда, храня токен в переменных окружения сервера.
const TELEGRAM_BOT_TOKEN = '8860857224:AAE4xUoAx7q-Cgm_ODW9Td8dUR0AEDe8WwU';
const TELEGRAM_CHAT_ID = '7366316835';
const MUSIC_SRC = '/leberch-piano-513745.mp3'; // файл лежит в папке public

// --- варианты анимаций -----------------------------------------------------

const mainStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const riseIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.07, delayChildren: 0.08 },
  },
  exit: { opacity: 0, y: -14, scale: 0.97, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

// --- фоновые плывущие сердечки (вместо статичного фона) --------------------

function BackgroundHearts({ reducedMotion }) {
  const hearts = useMemo(() => {
    if (reducedMotion) return [];
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 10 + Math.random() * 22,
      duration: 14 + Math.random() * 12,
      delay: -(Math.random() * 20),
      drift: (Math.random() - 0.5) * 80,
      opacity: 0.12 + Math.random() * 0.22,
    }));
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="bg-heart-layer" aria-hidden="true">
      {hearts.map((heart) => (
        <motion.span
          key={heart.id}
          className="bg-heart"
          style={{ left: `${heart.left}%`, width: heart.size, height: heart.size }}
          initial={{ y: '110vh', x: 0, opacity: 0 }}
          animate={{
            y: '-15vh',
            x: [0, heart.drift, 0],
            opacity: [0, heart.opacity, heart.opacity, 0],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: 'linear',
            x: { duration: heart.duration / 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
          }}
        >
          <FaHeart />
        </motion.span>
      ))}
    </div>
  );
}

// --- искорки вокруг сердца (только когда мишка счастлив) -------------------

function Sparkles({ show, reducedMotion }) {
  if (reducedMotion) return null;

  const points = [
    { x: 58, y: 150, delay: 0 },
    { x: 142, y: 150, delay: 0.08 },
    { x: 100, y: 130, delay: 0.16 },
    { x: 72, y: 190, delay: 0.24 },
    { x: 128, y: 190, delay: 0.32 },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.g key="sparkles">
          {points.map((p, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0, x: p.x, y: p.y }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.6],
                y: p.y - 18,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <path
                d={`M${p.x} ${p.y - 7} L${p.x + 2} ${p.y - 2} L${p.x + 7} ${p.y} L${p.x + 2} ${p.y + 2} L${p.x} ${p.y + 7} L${p.x - 2} ${p.y + 2} L${p.x - 7} ${p.y} L${p.x - 2} ${p.y - 2} Z`}
                fill="#f0deb4"
              />
            </motion.g>
          ))}
        </motion.g>
      )}
    </AnimatePresence>
  );
}

// --- медвежонок-талисман ----------------------------------------------------

function BearMascot({ mood, reducedMotion }) {
  const isSurprised = mood === 'surprised';
  const isHappy = mood === 'happy';

  return (
    <motion.div
      className="mascot"
      initial={{ y: -50, opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 13, delay: 0.1 }}
    >
      <motion.svg
        viewBox="0 0 200 200"
        className="mascot-svg"
        animate={
          reducedMotion
            ? {}
            : isHappy
              ? { y: [0, -6, 0] }
              : { y: [0, -3, 0] }
        }
        transition={{ duration: isHappy ? 1.1 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* уши */}
        <circle cx="48" cy="46" r="26" fill="#f7c9a6" />
        <circle cx="152" cy="46" r="26" fill="#f7c9a6" />
        <circle cx="48" cy="46" r="13" fill="#ffdfc2" />
        <circle cx="152" cy="46" r="13" fill="#ffdfc2" />

        {/* голова */}
        <circle cx="100" cy="92" r="72" fill="#ffcfa8" />

        {/* румянец */}
        <ellipse cx="62" cy="112" rx="14" ry="9" fill="#ffb3c1" opacity="0.85" />
        <ellipse cx="138" cy="112" rx="14" ry="9" fill="#ffb3c1" opacity="0.85" />

        {/* брови (только когда удивлён) */}
        <AnimatePresence>
          {isSurprised && (
            <motion.g
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <path d="M67 68 Q78 58 90 66" stroke="#6b5266" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M110 66 Q122 58 133 68" stroke="#6b5266" strokeWidth="4" fill="none" strokeLinecap="round" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* глаза */}
        {isSurprised ? (
          <>
            <circle cx="78" cy="88" r="9" fill="#4a3f5c" />
            <circle cx="122" cy="88" r="9" fill="#4a3f5c" />
          </>
        ) : (
          <>
            <ellipse className={`bear-eye ${reducedMotion ? '' : 'blink'}`} cx="78" cy="88" rx="6.5" ry="7.5" fill="#4a3f5c" />
            <ellipse className={`bear-eye ${reducedMotion ? '' : 'blink'}`} cx="122" cy="88" rx="6.5" ry="7.5" fill="#4a3f5c" />
          </>
        )}

        {/* нос */}
        <ellipse cx="100" cy="104" rx="8" ry="6" fill="#7a5647" />

        {/* рот */}
        {isSurprised ? (
          <ellipse cx="100" cy="122" rx="7" ry="9" fill="#7a5647" />
        ) : isHappy ? (
          <path d="M78 114 Q100 138 122 114" stroke="#7a5647" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M84 116 Q100 128 116 116" stroke="#7a5647" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}

        {/* искорки над сердцем, когда мишка счастлив */}
        <Sparkles show={isHappy} reducedMotion={reducedMotion} />

        {/* лапы + сердце — общая группа, чтобы вместе "приподнимать" сердце */}
        <motion.g
          animate={
            reducedMotion
              ? {}
              : isHappy
                ? { y: [0, -16, -11], rotate: [0, -3, 3, 0] }
                : { y: 0, rotate: 0 }
          }
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <ellipse cx="62" cy="168" rx="22" ry="18" fill="#ffcfa8" />
          <ellipse cx="138" cy="168" rx="22" ry="18" fill="#ffcfa8" />

          {/* сердце в лапах */}
          <motion.path
            d="M100 150
               C 88 138, 66 142, 66 160
               C 66 176, 88 186, 100 196
               C 112 186, 134 176, 134 160
               C 134 142, 112 138, 100 150 Z"
            fill="#ff8fa3"
            animate={
              reducedMotion
                ? {}
                : isHappy
                  ? { scale: [1, 1.35, 1.15], y: [0, -6, -4] }
                  : { scale: [1, 1.06, 1] }
            }
            transition={{
              duration: isHappy ? 0.55 : 1.8,
              repeat: isHappy ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '100px 168px' }}
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

function App() {
  const prefersReducedMotion = useReducedMotion();

  const [isYesOpen, setIsYesOpen] = useState(false);
  const [escapeCount, setEscapeCount] = useState(0);
  const [hasEscaped, setHasEscaped] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [wish, setWish] = useState('');
  const [showDateError, setShowDateError] = useState(false);
  const [showPlaceError, setShowPlaceError] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [noPosition, setNoPosition] = useState({ left: 0, top: 0 });
  const [hearts, setHearts] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mood, setMood] = useState('idle'); // idle | surprised | happy

  const yesScale = useMemo(() => Math.min(2.0, 1 + escapeCount * 0.1), [escapeCount]);

  const audioRef = useRef(null);
  const yesBtnRef = useRef(null);
  const moodTimeoutRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    if (musicOn) {
      audioRef.current.play().catch((err) => {
        console.error('Не удалось воспроизвести музыку:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [musicOn]);

  useEffect(() => {
    return () => clearTimeout(moodTimeoutRef.current);
  }, []);

  function launchHearts(count, origin) {
    const originX = origin?.x ?? window.innerWidth / 2;
    const originY = origin?.y ?? window.innerHeight / 2;

    const nextHearts = Array.from({ length: count }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 110 + Math.random() * 240;
      return {
        id: Date.now() + index + Math.random(),
        originX,
        originY,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 70,
        size: 14 + Math.random() * 18,
        duration: 1.1 + Math.random() * 0.9,
        delay: index * 0.02,
        rotate: (Math.random() - 0.5) * 200,
      };
    });

    setHearts((prev) => [...prev, ...nextHearts]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((heart) => !nextHearts.some((item) => item.id === heart.id)));
    }, 2600);
  }

  function handleNoHover() {
    setHasEscaped(true);
    setEscapeCount((prev) => prev + 1);

    if (mood !== 'happy') {
      setMood('surprised');
      clearTimeout(moodTimeoutRef.current);
      moodTimeoutRef.current = setTimeout(() => setMood('idle'), 800);
    }

    const margin = 20;
    const btnWidth = 160;
    const btnHeight = 56;

    const maxLeft = Math.max(margin, window.innerWidth - btnWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - btnHeight - margin);

    const nextLeft = margin + Math.random() * (maxLeft - margin);
    const nextTop = margin + Math.random() * (maxTop - margin);

    setNoPosition({ left: nextLeft, top: nextTop });
  }

  function handleYes() {
    const rect = yesBtnRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : undefined;

    clearTimeout(moodTimeoutRef.current);
    setMood('happy');
    setIsYesOpen(true);
    setEscapeCount(0);
    setHasEscaped(false);
    launchHearts(20, origin);
  }

  function sendToTelegram(dateFormatted, place, wishText) {
    const text =
      'Она ответила "Да"!\n\n' +
      'Дата: ' + dateFormatted + '\n' +
      'Куда: ' + place +
      (wishText ? '\nПожелания: ' + wishText : '');

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    }).catch((err) => console.error('Не удалось отправить сообщение в Telegram:', err));
  }

  function handleSubmit() {
    let valid = true;

    if (!selectedDate) {
      setShowDateError(true);
      valid = false;
    } else {
      setShowDateError(false);
    }

    if (!selectedPlace) {
      setShowPlaceError(true);
      valid = false;
    } else {
      setShowPlaceError(false);
    }

    if (!valid) return;

    const dateFormatted = format(selectedDate, 'd MMMM yyyy, HH:mm', { locale: ru });
    sendToTelegram(dateFormatted, selectedPlace, wish);
    setIsSubmitted(true);
    setIsYesOpen(false);
    launchHearts(36, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }

  function toggleMusic() {
    setMusicOn((prev) => !prev);
  }

  const showActions = !isSubmitted && !isYesOpen;

  return (
    <div className="app-shell">
      <div className="blob blob-mint" aria-hidden="true" />
      <div className="blob blob-lavender" aria-hidden="true" />
      <div className="blob blob-peach" aria-hidden="true" />

      <BackgroundHearts reducedMotion={prefersReducedMotion} />

      <div className="heart-layer" aria-hidden="true">
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            className="floating-heart"
            style={{ left: heart.originX, top: heart.originY, width: heart.size, height: heart.size }}
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: 0, scale: 1.1, x: heart.dx, y: heart.dy, rotate: heart.rotate }}
            transition={{ duration: heart.duration, delay: heart.delay, ease: [0.16, 1, 0.3, 1] }}
          >
            <FaHeart />
          </motion.span>
        ))}
      </div>

      <motion.div
        className="content-card"
        variants={mainStagger}
        initial="hidden"
        animate="visible"
      >
        <motion.button variants={riseIn} className="music-toggle" onClick={toggleMusic} type="button">
          <FaMusic />
          <span>{musicOn ? 'Выключить музыку' : 'Включить музыку'}</span>
        </motion.button>

        <BearMascot mood={mood} reducedMotion={prefersReducedMotion} />

        <motion.p variants={riseIn} className="eyebrow">
          Один важный вопрос
        </motion.p>

        <motion.h1 variants={riseIn}>
          Пойдёшь со мной <em>на свидание?</em>
        </motion.h1>

        <motion.p variants={riseIn} className="subtitle">
          Один клик — и мы уже придумываем, куда пойти
        </motion.p>

        {showActions && (
          <motion.div variants={riseIn} className="actions">
            <motion.button
              ref={yesBtnRef}
              type="button"
              className="yes-btn"
              onClick={handleYes}
              animate={{ scale: yesScale }}
              whileHover={{ scale: yesScale * 1.05 }}
              whileTap={{ scale: yesScale * 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <FaHeart />
              Да
            </motion.button>

            <motion.button
              type="button"
              className={`no-btn ${hasEscaped ? 'escaping' : ''}`}
              animate={
                hasEscaped
                  ? { left: noPosition.left, top: noPosition.top, rotate: [0, -8, 6, 0] }
                  : {}
              }
              transition={{ type: 'spring', stiffness: 320, damping: 16 }}
              onMouseEnter={handleNoHover}
              onTouchStart={(e) => {
                e.preventDefault();
                handleNoHover();
              }}
              onClick={(e) => {
                e.preventDefault();
                handleNoHover();
              }}
            >
              {noTexts[Math.min(escapeCount, noTexts.length - 1)]}
            </motion.button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isYesOpen && !isSubmitted && (
            <motion.div
              key="planner"
              className="planner"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.h2 variants={riseIn}>Теперь давай спланируем</motion.h2>

              <motion.label variants={riseIn} className="field-label">
                <FaCalendarAlt />
                Когда тебе удобно
              </motion.label>
              <motion.div variants={riseIn}>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setShowDateError(false);
                  }}
                  locale="ru"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd.MM.yyyy HH:mm"
                  minDate={new Date()}
                  placeholderText="Выбери дату и время"
                  className="date-picker"
                  calendarClassName="custom-calendar"
                />
              </motion.div>
              {showDateError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">
                  Выбери дату и время
                </motion.div>
              )}

              <motion.label variants={riseIn} className="field-label">
                <FaMapMarkerAlt />
                Куда пойдём
              </motion.label>
              <motion.div variants={riseIn} className="place-grid">
                {placeCards.map((place) => (
                  <motion.button
                    key={place.value}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`place-card ${selectedPlace === place.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPlace(place.value);
                      setShowPlaceError(false);
                    }}
                  >
                    <span className="place-icon">{place.icon}</span>
                    {place.value}
                  </motion.button>
                ))}
              </motion.div>
              {showPlaceError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">
                  Выбери, куда хочешь пойти
                </motion.div>
              )}

              <motion.label variants={riseIn} className="field-label">
                <FaCommentAlt />
                Пожелания <span>(необязательно)</span>
              </motion.label>
              <motion.textarea
                variants={riseIn}
                value={wish}
                onChange={(event) => setWish(event.target.value)}
                placeholder="Например: не люблю острое, хочу пораньше закончить..."
              />

              <motion.button
                variants={riseIn}
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="submit-btn"
                type="button"
                onClick={handleSubmit}
              >
                <FaPaperPlane />
                Отправить ответ
              </motion.button>
            </motion.div>
          )}

          {isSubmitted && (
            <motion.div
              key="summary"
              className="summary"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div variants={riseIn} className="summary-title">
                <FaCheckCircle />
                Договорились
              </motion.div>

              <motion.div variants={riseIn} className="summary-line">
                <FaCalendarAlt />
                <div>
                  <strong>Дата и время</strong>
                  <br />
                  {format(selectedDate, 'd MMMM yyyy, HH:mm', { locale: ru })}
                </div>
              </motion.div>

              <motion.div variants={riseIn} className="summary-line">
                <FaMapMarkerAlt />
                <div>
                  <strong>Куда</strong>
                  <br />
                  {selectedPlace}
                </div>
              </motion.div>

              {wish && (
                <motion.div variants={riseIn} className="summary-line">
                  <FaCommentAlt />
                  <div>
                    <strong>Пожелания</strong>
                    <br />
                    {wish}
                  </div>
                </motion.div>
              )}

              <motion.div variants={riseIn} className="summary-footer">
                Жду встречи <FaStar />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;