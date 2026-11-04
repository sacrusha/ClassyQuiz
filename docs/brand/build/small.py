"""Small-size cuts drawn on the pixel grid: 32 and 16. Same parts as the master, simplified:
no band gap at 16, no glints, eyes and nose as whole pixels, the brim straight, rims a full pixel.
Each returns an SVG body for a given hat colour; viewBox 0 0 N N."""

ORANGE, INK, WHITE = "#e26b22", "#1d1d1b", "#ffffff"


def s32(hat=INK, orange=ORANGE, white=WHITE, ink=INK):
    # head: ear outer edges vertical from (5,17)/(27,17) to the tips, inner edges at 60 deg to under the brim, jaw to chin (16,31)
    head = "M5 17V3.5L9.62 11.5H22.38L27 3.5V17Q25.6 27.4 16 31Q6.4 27.4 5 17Z"
    # white face: cheeks up round the eyes, bridge 2px down to the nose, joined under it
    face = ("M7 18.4Q9.8 15.4 14.2 16.6L15 25.4H17L17.8 16.6Q22.2 15.4 25 18.4"
            "Q23.8 26.6 16 29.6Q8.2 26.6 7 18.4Z")
    eyes = ('<circle cx="11.6" cy="20" r="1.75"/><circle cx="20.4" cy="20" r="1.75"/>')
    nose = '<rect x="14" y="24.8" width="4" height="2.8" rx="1.4"/>'
    hatd = ("M12 1.6Q12 1 12.6 1H19.4Q20 1 20 1.6V8H12Z"    # crown above the band gap
            "M12 9H20V11.5H12Z"                               # band strip, into the brim
            "M9 11H23A1 1 0 0 1 23 13H9A1 1 0 0 1 9 11Z")     # brim
    return (f'<path fill="{orange}" d="{head}"/><path fill="{white}" d="{face}"/>'
            f'<g fill="{ink}">{eyes}{nose}</g><path fill="{hat}" d="{hatd}"/>')


def s16(hat=INK, orange=ORANGE, white=WHITE, ink=INK, cw=4):
    head = "M2 8.5V1.6L4.25 5.5H11.75L14 1.6V8.5Q13.3 13.8 8 16Q2.7 13.8 2 8.5Z"
    face = "M3.2 9.2Q4.6 7.6 7 8.1V12H9V8.1Q11.4 7.6 12.8 9.2Q12.2 13.4 8 15Q3.8 13.4 3.2 9.2Z"
    eyes = '<rect x="4" y="9" width="2" height="2"/><rect x="10" y="9" width="2" height="2"/>'
    nose = '<rect x="7" y="12" width="2" height="2"/>'
    hatd = f"M{8-cw/2} 0H{8+cw/2}V5H{8-cw/2}ZM3 5H13V6H3Z"
    return (f'<path fill="{orange}" d="{head}"/><path fill="{white}" d="{face}"/>'
            f'<g fill="{ink}">{eyes}{nose}</g><path fill="{hat}" d="{hatd}"/>')


def doc(body, n):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}">{body}</svg>'
