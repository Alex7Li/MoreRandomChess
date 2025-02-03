{
    const positions = [
        {'fen': 'r1b2b1r/pp2k1pp/2p3q1/3np3/1nBP4/2N5/PPP2PPP/R1BQR1K1 w - - 5 13', 'eval': 12, 'pgn': '1. d4 g6 2. c4 Bg7 3. Nc3 c5 4. d5 Bxc3+ 5. bxc3 Qa5 6. Qc2 f5 7. e4 fxe4 8. f3 e3 9. Ne2 Nf6 10. Ng3 d6 11. Bxe3 Nbd7 12. Be2 b5 13. cxb5 a6 14. O-O axb5 15. a4 Nxd5 16. axb5 Qxa1 17. Rxa1 Rxa1+ 18. Bc1 c4 19. Qb2 Ra4 20. Qd2 N7b6 21. Qh6 Be6 22. h4 Nd7 23. Ne4 Rg8 24. Kh2 N5f6 25. Nxf6+ Nxf6 26. Bg5 Ra2 27. Bd1 Ra1 28. Bc2 Ra2 29. Bd1 Ra1 30. Bxf6 exf6 31. Bc2 Ra2 32. Qc1 Ke7 33. h5 f5 34. b6 Rb8 35. Bb1 Re2 36. Qh6 Kf6 37. Qxh7 Rg8 38. b7 Rb2 39. Bc2 gxh5 40. Kg1 d5 41. Qxh5 Rxb7 42. g4 Rf7 43. Bxf5 Ke7 44. Bxe6 Kxe6 45. Qh6+ Kd7 46. Kf2 Rfg7 47. Qa6 Rg5 48. Qb6 Ke7 49. Qc5+ Kf7 50. Qd6 R8g7 51. Qc6 Kg8 52. Qe8+ Kh7 53. Ke3 R7g6 54. Kf4 Rg8 55. Qe7+ R8g7 56. Qf6 Kg8 57. Qd4 R7g6 58. Qa7 Rg7 59. Qb8+ Kh7 60. Ke3 Rf7 61. Qe8 Rfg7 62. Kd2 R5g6 63. Ke3 Rg5 64. Kf2 R5g6 65. Qd8 Rg5 66. Qf6 Rg8 67. Qf7+ R8g7 68. Qf8 R7g6 69. Qb8 Rg7 70. Qc8 Rf7 71. Qe8 Rfg7 72. Kg3 Rg8 73. Qd7+ R8g7 74. Qc8 Rg8 75. Qc5 R8g6 76. Qe7+ Kh6 77. Kf2 Rg8 78. Qd6+ R8g6 79. Qd7 Rg7 80. Qd8 Kg6 81. Qf8 Kh7 82. Ke3 R7g6 83. Kd2 Rg7 84. Qf4 R7g6 85. Qe3 Rg7 86. Ke2 Kg6 87. Kf1 Kf7 88. Qd2 R7g6 89. Ke1 Kf8 90. Kf2 Kf7 91. f4 Rxg4 92. Qxd5+ Kg7 93. Qd4+ Kh7 94. Kf3 Rg3+ 95. Ke4 Re6+ 96. Kf5 Ree3 97. Kf6 Kh6 98. f5 Kh5 99. Qd1+ Kh4', 'headers': 'A vs B at tcec'},
        {'fen': 'r1b1k2r/3np2p/3p2p1/qppn4/P7/2P1BPN1/2Q1B1PP/R4RK1 w kq - 0 16', 'eval': 48},
    ]
    const searchParams = new URLSearchParams(window.location.search)

    let seed = parseInt(searchParams.get('seed'))
    if (seed == null || isNaN(seed) || seed <= 0 || seed > positions.length) {
        seed = Math.floor(Math.random() * positions.length) + 1
    }
    document.getElementById("seed").innerHTML = "Position #" + seed + " of " + positions.length

    const FEN = positions[seed - 1]['fen']
    const PGN = positions[seed - 1]['pgn']
    const header = positions[seed - 1]['headers']
    const eval = positions[seed - 1]['eval']
    document.getElementById('FEN_text').innerHTML = FEN
    document.getElementById('FEN_image').src = "https://fen2image.chessvision.ai/" + FEN
    if (eval != undefined) {
        let sign = '+'
        if (eval < 0) {
            sign = ''
        }
         document.getElementById('stockfish_eval').innerHTML = "Estimated advantage (+ for white, - for black): "  + sign + Math.round(eval * 100) / 100
    }
    if (PGN != undefined) {
         document.getElementById('pgn').innerHTML = PGN
    }
    if (header != undefined) {
         document.getElementById('gameinfo').innerHTML = 'Game source: ' + header
    }

    document.getElementById('sharePosition').href = window.location.origin + window.location.pathname + '?seed=' + seed
    document.getElementById('playWithFriend').href = 'https://lichess.org/?fen=' + FEN + '#friend'
    document.getElementById('playWithComputer').href = 'https://lichess.org/?user=maia5&fen=' + FEN + '#friend'
    document.getElementById('analysisBoard').href = 'https://lichess.org/analysis/standard/' + FEN
}
