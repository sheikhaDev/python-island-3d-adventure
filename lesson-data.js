window.LessonData = {
  "types": [
    {
      "prompt": "صنّف القيمة كما كُتبت في Python، مع الانتباه إلى علامات الاقتباس.",
      "code": "25",
      "options": [
        "int",
        "float",
        "str",
        "bool"
      ],
      "answer": "int",
      "why": "25 عدد صحيح؛ لا يحتوي نقطة عشرية ولا علامات اقتباس."
    },
    {
      "prompt": "إلى أي صندوق تنتمي هذه القيمة؟",
      "code": "\"25\"",
      "options": [
        "int",
        "float",
        "str",
        "bool"
      ],
      "answer": "str",
      "why": "علامتا الاقتباس تجعلان \"25\" نصًا، حتى إن احتوى أرقامًا."
    },
    {
      "prompt": "صنّف هذه القيمة.",
      "code": "25.0",
      "options": [
        "int",
        "float",
        "str",
        "bool"
      ],
      "answer": "float",
      "why": "25.0 عدد عشري في Python بسبب النقطة، حتى لو كان جزؤه الكسري صفرًا."
    },
    {
      "prompt": "هل هذه القيمة نص أم قيمة منطقية؟",
      "code": "False",
      "options": [
        "int",
        "float",
        "str",
        "bool"
      ],
      "answer": "bool",
      "why": "False دون اقتباس قيمة منطقية. أما \"False\" فهي نص."
    },
    {
      "prompt": "صنّف هذه القيمة.",
      "code": "\"True\"",
      "options": [
        "int",
        "float",
        "str",
        "bool"
      ],
      "answer": "str",
      "why": "هذه قيمة نصية لأن True محاطة بعلامتي اقتباس."
    }
  ],
  "convert": [
    {
      "prompt": "اختر البوابة لتحويل النص إلى عدد صحيح، ليصبح ناتج الطباعة 10.",
      "code": "value = \"8\"\nprint(____(value) + 2)",
      "options": [
        "int",
        "float",
        "str"
      ],
      "answer": "int",
      "why": "int(\"8\") تعطي العدد الصحيح 8؛ 8 + 2 تساوي 10. float ستطبع 10.0.",
      "expected": "10"
    },
    {
      "prompt": "اختر البوابة لتحويل السعر النصي إلى عدد عشري.",
      "code": "price = \"2.5\"\nprint(____(price) + 1)",
      "options": [
        "int",
        "float",
        "str"
      ],
      "answer": "float",
      "why": "float(\"2.5\") تعطي 2.5؛ الناتج 3.5. int(\"2.5\") تسبب ValueError.",
      "expected": "3.5"
    },
    {
      "prompt": "اختر البوابة لربط العدد بالعنوان النصي دون خطأ.",
      "code": "age = 12\nprint(\"Age: \" + ____(age))",
      "options": [
        "int",
        "float",
        "str"
      ],
      "answer": "str",
      "why": "str(12) تعطي النص \"12\"، فيصبح الناتج Age: 12.",
      "expected": "Age: 12"
    },
    {
      "prompt": "اختر التعبير الذي يحوّل النص العشري إلى عدد صحيح بحذف الجزء الكسري.",
      "code": "print(____)",
      "options": [
        "int(\"7.8\")",
        "int(float(\"7.8\"))",
        "str(\"7.8\")"
      ],
      "answer": "int(float(\"7.8\"))",
      "why": "float تحول النص إلى 7.8، ثم int تحذف الجزء الكسري، فيكون الناتج 7.",
      "expected": "7"
    },
    {
      "prompt": "اختر البوابة المناسبة للحصول على العدد العشري 4.0 من عدد صحيح.",
      "code": "print(____(4))",
      "options": [
        "int",
        "float",
        "str"
      ],
      "answer": "float",
      "why": "float(4) تعطي قيمة عددية عشرية 4.0. str(4) تعطي نصًا.",
      "expected": "4.0"
    }
  ],
  "input": [
    {
      "prompt": "رتّب الأسطر لاستقبال اسم الطالبة ثم عرض رسالة ترحيب.",
      "input": "Luma",
      "lines": [
        "name = input()",
        "message = \"Hello \" + name",
        "print(message)"
      ],
      "expected": "Hello Luma",
      "why": "نستقبل الاسم أولًا، ثم نبني الرسالة، ثم نطبعها."
    },
    {
      "prompt": "رتّب الأسطر لحساب العمر بعد سنتين.",
      "input": "12",
      "lines": [
        "age_text = input()",
        "age = int(age_text)",
        "future = age + 2",
        "print(future)"
      ],
      "expected": "14",
      "why": "input تعيد نصًا؛ نحوله إلى int قبل إضافة 2."
    },
    {
      "prompt": "رتّب الأسطر لحساب ثمن قطعتين بسعر عشري.",
      "input": "2.5",
      "lines": [
        "price_text = input()",
        "price = float(price_text)",
        "total = price * 2",
        "print(total)"
      ],
      "expected": "5.0",
      "why": "السعر العشري يحتاج float قبل الضرب، ثم نطبع التكلفة."
    },
    {
      "prompt": "رتّب الأسطر لجمع عددين صحيحين. المدخل الأول 4 والثاني 6.",
      "input": "4\n6",
      "lines": [
        "first = int(input())",
        "second = int(input())",
        "total = first + second",
        "print(total)"
      ],
      "expected": "10",
      "why": "ترتيب الإدخال المطلوب: الأول ثم الثاني، ثم جمعهما وطباعة المجموع."
    },
    {
      "prompt": "رتّب الأسطر لمقارنة عمر الطالبة بالحد الأدنى 13.",
      "input": "12",
      "lines": [
        "age = int(input())",
        "can_join = age >= 13",
        "print(can_join)"
      ],
      "expected": "False",
      "why": "نحوّل العمر إلى عدد ثم نقارن. 12 أصغر من 13، لذلك النتيجة False."
    }
  ],
  "debug": [
    {
      "prompt": "عند إدخال 12، اختر القطعة التي تصلح الخطأ وتطبع 14.",
      "code": "age = input()\nprint(____ + 2)",
      "options": [
        "age",
        "int(age)",
        "str(age)"
      ],
      "answer": "int(age)",
      "why": "input تعيد \"12\" كنص؛ int(age) تحولها إلى عدد قبل الجمع.",
      "input": "12",
      "expected": "14"
    },
    {
      "prompt": "أصلح الحساب ليطبع 25.0 بدل تكرار النص.",
      "code": "price = \"12.5\"\nprint(____ * 2)",
      "options": [
        "price",
        "float(price)",
        "int(price)"
      ],
      "answer": "float(price)",
      "why": "ضرب النص يكرره. float تحول السعر إلى عدد عشري قبل الضرب.",
      "expected": "25.0"
    },
    {
      "prompt": "أصلح الربط ليطبع الاسم مع الرقم دون TypeError.",
      "code": "name = \"Ali\"\nprint(name + ____)",
      "options": [
        "4",
        "str(4)",
        "int(\"Ali\")"
      ],
      "answer": "str(4)",
      "why": "ربط النصوص بعلامة + يحتاج نصين، لذلك نحوّل 4 إلى نص.",
      "expected": "Ali4"
    },
    {
      "prompt": "أكمل التعبير بحيث يطبع البرنامج 8.2 دون ValueError.",
      "code": "x = ____\nprint(x + 1)",
      "options": [
        "int(\"7.2\")",
        "\"7.2\"",
        "float(\"7.2\")"
      ],
      "answer": "float(\"7.2\")",
      "why": "النص العشري يقبل float. int(\"7.2\") لا تعمل مباشرة.",
      "expected": "8.2"
    },
    {
      "prompt": "أصلح التعبير ليحسب المجموع 10 بدل النص 46.",
      "code": "a = \"4\"\nb = \"6\"\nprint(____)",
      "options": [
        "a + b",
        "int(a) + int(b)",
        "str(a + b)"
      ],
      "answer": "int(a) + int(b)",
      "why": "نحوّل كل نص إلى عدد ثم نجمع العددين 4 و6.",
      "expected": "10"
    }
  ]
};
