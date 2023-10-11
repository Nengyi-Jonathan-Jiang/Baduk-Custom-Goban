/**
 * @typedef {{size: number, width: number, height: number, pattern: string}} CustomBoardData
 */

/** @type {Readonly<[CustomBoardData]>} */
const custom_boards = Object.freeze([
    {size: 19, width: 19, height: 19, pattern: `${'O'.repeat(19)}\n`.repeat(19)},
    {size: 13, width: 13, height: 13, pattern: `${'O'.repeat(13)}\n`.repeat(13)},
    {size: 9, width: 9, height: 9, pattern: `${'O'.repeat(9)}\n`.repeat(9)},
    { size: 26, width: 26, height: 20, pattern: `
        .                OOO
        .               OOOOOOOO
        .     O         O OOOOOO
        .     OO         OOOOOOO
        .   OOOOO       OOOOOOOO
        .   OOOOOO     OOOOOOOO
        . OOOOOOOOOOO OOOOOOOO
        OOOOOOOOOOOOOOOOOOOOOO O
        OOOOOOOOOOOOOOOOOOOOOOOO
        OOOOOOOOOOOOOOOOOOOOOOO
        .OOOOOOOOOOOOOOOOOOOOOOOO
        .  OOOOOOOOOOOOOOOOOOOOOO
        .   OOOOOOOOOOOOOOOOOOOOO
        .  OOOOOOOOOOOOOOOOOOOOOO
        .  OOOOOOOOOOOOOOOOOOOOOO
        .   OOOO   OOOOOOOOOOOOO O
        .    OO   OOOOOOOOOOOOO
        .         OOOOOOOOOOOO
        .          OOOOOOOOO
        .           OO  OO
        `
    }, { size: 32, width: 32, height: 32, pattern: `
        .                       O
        .                      OO
        .                      OOO
        .                      OOOO
        .                      OOOOOOOO
        .                    O OOOOOOO
        .                    O OOOOOOOO
        .                   OOOOOOOO
        .                   O OOOOOO
        .                   OO    O
        .                   O
        .                   OOO
        .                  OOOO
        .                   OOO
        .                  OOOOO
        .                  OOOOO
        .                  OOOO
        .               O OOOOO
        .               OOOOO
        .            OO  OOOOO
        .            OOOOOOOOO
        .           OOOOOOOOO
        .      OOO  OOOOOOOOO
        .    OOOOOOOOOOOOOOOO
        .  OOOOOOOOOOOOOOOOO
        . OOOOO O OOOOOO OO
        OOOO  OOOOOOO
        OOOO OOOO OO
        . OO O
        .OOO
        OOO
        OOO   
        `
    }, {size: 29, width: 29, height: 18, pattern: `
        . OOOO                      O
        . OOOOOOOO                 OO
        .OOOOOOOOOOOOOOOO          OO
        .OOOOOOOOOOOOOOOOOOO      OOO
        .OOOOOOOOOOOOOOOOOOO O  OOOOO
        OOOOOOOOOOOOOOOOOOO OO  OOOO
        OOOOOOOOOOOOOOOOOOO OO OOOO
        OOOOOOOOOOOOOOOOOOOOOOOOOOO
        .OOOOOOOOOOOOOOOOOOOOOOOOO
        .OOOOOOOOOOOOOOOOOOOOOOOOO
        .OOOOOOOOOOOOOOOOOOOOOOOOO
        . OOOOOOOOOOOOOOOOOOOOOOOO
        .   OOOOOOOOOOOOOOOOOOOOO
        .     OOOOOOOOOOOOOOOOOOO
        .       OO OOOOOOOOOOOOOO
        .           OOOOO     OOOO
        .            OO        OOO
        .            O           O
        `
    }, {size: 27, width: 17, height: 27, pattern: `
        .              OO
        .             OOO
        .          OOOOO
        .      O    OOO
        .      OOO OOOO
        .     OOOOOOOOO
        .   OOOOOOOOOO
        . OOOOOOOOOOO
        OOOOOOOOOOO
        .OOOOOOOOO
        .  OOOOOO
        .  OOOOOOO
        . OOOOOOOOO
        . OOOOOOOOOO
        .OOOOOOOOOOO
        .  O OOOOOOO
        .     OOOOOOO
        .     OOOOOOOO
        .      OOOOOOO
        .    OOOOOOOOOO
        .    OOOOOOOOOO
        .     OOOOOOOOO
        .     OOOOOOOOO
        .     OOOOOOOO
        .    OOOOOOOOO
        .    OOOOOO
        .     OO
        `
    }, {size: 15, width: 1, height: 15, pattern: 'O\n'.repeat(15)}
]);

module.exports = {custom_boards};