import cv2
import numpy as np
import matplotlib.pyplot as plt
import os
import glob


# ============================================
# 1. IMAGE PATHS
# ============================================

image_folder = "ml/images"

blank_image_path = os.path.join(
    image_folder,
    "blank_sheet.png"
)


# ============================================
# 2. FIND TEST SHEET
# ============================================

possible_test_files = [
    "test_sheet_01.jpg",
    "test_sheet_01.jpeg",
    "test_sheet_01.png",
    "test_sheet_01.webp"
]

test_image_path = None


for filename in possible_test_files:

    path = os.path.join(
        image_folder,
        filename
    )

    if os.path.exists(path):

        test_image_path = path

        break


if test_image_path is None:

    print("\nERROR: Test sheet was not found.")

    print("\nFiles currently inside ml/images:")

    for file in glob.glob(
        os.path.join(image_folder, "*")
    ):

        print(
            " -",
            os.path.basename(file)
        )

    exit()


# ============================================
# 3. LOAD IMAGES
# ============================================

blank_image = cv2.imread(
    blank_image_path
)

test_image = cv2.imread(
    test_image_path
)


if blank_image is None:

    print(
        "ERROR: Blank sheet could not be loaded."
    )

    exit()


if test_image is None:

    print(
        "ERROR: Test sheet could not be loaded."
    )

    exit()


print(
    "Blank sheet loaded successfully!"
)

print(
    "Test sheet loaded successfully!"
)

print(
    "Test sheet:",
    test_image_path
)


# ============================================
# 4. RESIZE IMAGES
# ============================================

target_width = 1000


# Blank sheet

blank_height, blank_width = (
    blank_image.shape[:2]
)

scale_blank = (
    target_width / blank_width
)

blank_target_height = int(
    blank_height * scale_blank
)

blank_resized = cv2.resize(
    blank_image,
    (
        target_width,
        blank_target_height
    )
)


# Test sheet

test_height, test_width = (
    test_image.shape[:2]
)

scale_test = (
    target_width / test_width
)

test_target_height = int(
    test_height * scale_test
)

test_resized = cv2.resize(
    test_image,
    (
        target_width,
        test_target_height
    )
)


# ============================================
# 5. CONVERT TO GRAYSCALE
# ============================================

blank_gray = cv2.cvtColor(
    blank_resized,
    cv2.COLOR_BGR2GRAY
)

test_gray = cv2.cvtColor(
    test_resized,
    cv2.COLOR_BGR2GRAY
)


# ============================================
# 6. EXPECTED BUBBLE POSITIONS
# ============================================

expected_x = [
    81, 109, 137, 165, 193,
    273, 301, 328, 356, 384,
    469, 496, 524, 552, 579,
    659, 685, 711, 738, 765,
    850, 877, 904, 932, 959
]


expected_y = [
    181, 221, 262, 305, 346,
    388, 430, 472, 515, 557
]


# ============================================
# 7. OPTIONS
# ============================================

options = [
    "A",
    "B",
    "C",
    "D",
    "E"
]


# ============================================
# 8. QUESTION BLOCKS
# ============================================

blocks = [
    (0, 5),
    (5, 10),
    (10, 15),
    (15, 20),
    (20, 25)
]


# ============================================
# 9. CREATE QUESTION STRUCTURE
# ============================================

questions = []


for block_index, (
    start_col,
    end_col
) in enumerate(blocks):

    for row in range(10):

        question_number = (
            block_index * 10
            + row
            + 1
        )

        question_options = []


        for column_index in range(
            start_col,
            end_col
        ):

            x = expected_x[
                column_index
            ]

            y = expected_y[row]

            option_index = (
                column_index
                - start_col
            )


            question_options.append(
                {
                    "option":
                        options[option_index],

                    "x":
                        x,

                    "y":
                        y
                }
            )


        questions.append(
            {
                "question":
                    question_number,

                "options":
                    question_options
            }
        )


# ============================================
# 10. DARKNESS FUNCTION
# ============================================

def calculate_darkness(
    gray_image,
    center_x,
    center_y,
    radius=7
):

    x1 = max(
        0,
        center_x - radius
    )

    x2 = min(
        gray_image.shape[1],
        center_x + radius
    )

    y1 = max(
        0,
        center_y - radius
    )

    y2 = min(
        gray_image.shape[0],
        center_y + radius
    )


    roi = gray_image[
        y1:y2,
        x1:x2
    ]


    mean_value = np.mean(roi)


    darkness = (
        255 - mean_value
    )


    return darkness


# ============================================
# 11. OMR THRESHOLDS
# ============================================

# Minimum extra darkness required
# to consider a bubble filled.

MARK_THRESHOLD = 40


# Minimum difference between the
# strongest and second strongest bubble.

MIN_MARGIN = 15


# ============================================
# 12. DETECT EACH QUESTION
# ============================================

detected_answers = []


for question in questions:

    question_number = (
        question["question"]
    )

    option_results = []


    # ----------------------------------------
    # Calculate difference for A-E
    # ----------------------------------------

    for option in question["options"]:

        x = option["x"]

        y = option["y"]


        blank_darkness = (
            calculate_darkness(
                blank_gray,
                x,
                y
            )
        )


        test_darkness = (
            calculate_darkness(
                test_gray,
                x,
                y
            )
        )


        difference = (
            test_darkness
            - blank_darkness
        )


        option_results.append(
            {
                "option":
                    option["option"],

                "blank_darkness":
                    blank_darkness,

                "test_darkness":
                    test_darkness,

                "difference":
                    difference,

                "x":
                    x,

                "y":
                    y
            }
        )


    # ----------------------------------------
    # Find bubbles above threshold
    # ----------------------------------------

    marked_options = []

    for option in option_results:

        if (
            option["difference"]
            >= MARK_THRESHOLD
        ):

            marked_options.append(
                option
            )


    # ----------------------------------------
    # CLASSIFICATION
    # ----------------------------------------

    if len(marked_options) == 0:

        status = "BLANK"

        answer = "-"

        confidence = 0


    elif len(marked_options) == 1:

        selected_option = (
            marked_options[0]
        )

        answer = (
            selected_option["option"]
        )

        status = "SELECTED"

        confidence = (
            selected_option["difference"]
        )


    else:

        # More than one bubble
        # appears to be filled.

        status = "MULTIPLE"

        answer = "-"

        confidence = max(
            option["difference"]
            for option in marked_options
        )


    # ----------------------------------------
    # Calculate margin
    # ----------------------------------------

    sorted_options = sorted(
        option_results,
        key=lambda item:
        item["difference"],
        reverse=True
    )


    highest_difference = (
        sorted_options[0]["difference"]
    )

    second_difference = (
        sorted_options[1]["difference"]
    )


    margin = (
        highest_difference
        - second_difference
    )


    # ----------------------------------------
    # Check confidence for selected answer
    # ----------------------------------------

    if status == "SELECTED":

        if margin < MIN_MARGIN:

            status = "UNCERTAIN"


    # ----------------------------------------
    # Store result
    # ----------------------------------------

    detected_answers.append(
        {
            "question":
                question_number,

            "answer":
                answer,

            "status":
                status,

            "confidence":
                confidence,

            "margin":
                margin,

            "options":
                option_results
        }
    )


# ============================================
# 13. DISPLAY RESULTS
# ============================================

print("\n")
print(
    "============================================"
)

print(
    "           OMR RESULTS"
)

print(
    "============================================"
)


for result in detected_answers:

    print(
        f"Q{result['question']:02d} "
        f"-> {result['answer']:1s} "
        f"| {result['status']:9s} "
        f"| Difference: "
        f"{result['confidence']:.2f}"
    )


# ============================================
# 14. SUMMARY
# ============================================

selected_count = 0
blank_count = 0
multiple_count = 0
uncertain_count = 0


for result in detected_answers:

    if result["status"] == "SELECTED":

        selected_count += 1

    elif result["status"] == "BLANK":

        blank_count += 1

    elif result["status"] == "MULTIPLE":

        multiple_count += 1

    elif result["status"] == "UNCERTAIN":

        uncertain_count += 1


print("\n")
print(
    "============================================"
)

print(
    "           OMR SUMMARY"
)

print(
    "============================================"
)

print(
    "Selected:",
    selected_count
)

print(
    "Blank:",
    blank_count
)

print(
    "Multiple:",
    multiple_count
)

print(
    "Uncertain:",
    uncertain_count
)


# ============================================
# 15. DRAW RESULTS
# ============================================

result_image = test_resized.copy()


for result in detected_answers:

    question_number = (
        result["question"]
    )

    answer = result["answer"]

    status = result["status"]


    # Skip if blank

    if status == "BLANK":

        continue


    # Skip if multiple

    if status == "MULTIPLE":

        continue


    # Skip if uncertain

    if status == "UNCERTAIN":

        continue


    # Find selected option

    selected_option = None


    for option in result["options"]:

        if option["option"] == answer:

            selected_option = option

            break


    if selected_option is None:

        continue


    x = selected_option["x"]

    y = selected_option["y"]


    # Draw red circle

    cv2.circle(
        result_image,
        (x, y),
        10,
        (0, 0, 255),
        2
    )


    # Draw question number

    cv2.putText(
        result_image,
        str(question_number),
        (x - 8, y - 12),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.35,
        (255, 0, 0),
        1
    )


# ============================================
# 16. DISPLAY RESULT
# ============================================

result_rgb = cv2.cvtColor(
    result_image,
    cv2.COLOR_BGR2RGB
)


plt.figure(
    figsize=(12, 7)
)

plt.imshow(
    result_rgb
)

plt.title(
    "OMR Answer Classification"
)

plt.axis("off")

plt.show()