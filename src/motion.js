export const palet = {
    hidden: { x: -30 },
    show: {
        x: 0,
    },
    exit: {
        x: -30,
    },
};

export const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.2,
            delayChildren: 2,
            type: "tween",
        },
    },
};

export const textContainer = (staggerChildren = 0.2, delayChildren = 0.5) => ({
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: staggerChildren,
            delayChildren: delayChildren,
        },
    },
});

export const fadeInY = (duration = 0.3, y = 50) => ({
    hidden: { opacity: 0, y: y },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration,
            type: "spring",
            bounce: 0.3,
            ease: "linear",
            staggerChildren: 0.4,
            // delayChildren: 0.1
        },
    },
});

export const fadeInX = (x = -50, duration = 0.3) => ({
    hidden: { opacity: 0, x: x },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            duration: duration,
            ease: "easeInOut",
            staggerChildren: 0.4,
        },
    },
})


export const letterVariant = () => ({
    hidden: { x: "-50%", opacity: 0 },
    show: {
        x: 0,
        opacity: 1,

        transition: {
            type: "spring",
            ease: "linear",
            bounce: 0.4,
            duration: 0.5
        }
    },
});

