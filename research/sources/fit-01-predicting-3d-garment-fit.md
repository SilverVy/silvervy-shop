Source: https://dl.acm.org/doi/full/10.1145/3688671.3688795
Title: Predicting 3D garment fit in digital product development: Selecting input variables | Proceedings of the 13th Hellenic Conference on Artificial Intelligence
Fetched: 2026-11-12T11:36:15.223Z

[skip to main content](https://dl.acm.org/doi/full/10.1145/3688671.3688795#skip-to-main-content)

## ACM is now Open Access

×

As part of the Digital Library's transition to [Open Access](https://dl.acm.org/action/clickThrough?id=108180&url=%2Fopenaccess&loc=%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&pubId=64510861&placeholderId=101025&productId=108179 "Follow link to the ACM DL Open Access information page"), new features for researchers are available in the _Premium Edition_. [Click here to learn more](https://dl.acm.org/action/clickThrough?id=108180&url=%2Fpremium&loc=%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&pubId=64510861&placeholderId=101025&productId=108179 "More information about Premium Edition").

**You are currently in the Basic Edition. Features requiring a subscription appear in grey.**

[Sign In](https://dl.acm.org/action/clickThrough?id=108180&url=%2Faction%2FshowLogin%3FredirectUri%3Dhttps%253A%252F%252Fdl.acm.org%252Fdoi%252Ffull%252F10.1145%252F3688671.3688795&loc=%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&pubId=64510861&placeholderId=101025&productId=108179) [Upgrade](https://dl.acm.org/action/clickThrough?id=108180&url=%2Fabout%2Fupgrade&loc=%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&pubId=64510861&placeholderId=101025&productId=108179 "Learn about upgrading to Premium Edition")

Several features on this page require Premium Access.

[Learn more](https://dl.acm.org/about/upgrade) [Sign in](https://dl.acm.org/action/showLogin?redirectUri=%2Fdoi%2F10.1145%2F3688671.3688795)

Contents

## Abstract

### Abstract

Three-dimensional (3D) technologies such as 3D digital prototyping have recently been used in apparel engineering to reduce the number of costly physical prototypes. This technology can simulate garment drapes by digitally sewing 2D patterns and placing them on a 3D avatar. Yet, current limitations in simulation accuracy mean physical prototypes are still indispensable. Integrating AI technologies shows promise in accelerating digital transformation in the apparel industry. AI can support decision-making in apparel design, size and fit prediction, and fashion recommendations. It can also assist decision-making in technical design by predicting garment fit before making physical prototypes or offering solutions for misfit areas. Research indicates that models such as Naive Bayes (NB), Support Vector Machine (SVM), and Artificial Neural Networks (ANN) offer robust solutions for fit evaluation. However, they require further testing across diverse garment styles and demographics. Developing a nuanced classification system for fit conditions could improve model accuracy, ultimately supporting the industry's shift towards digital and AI-enhanced product development. In this study, we propose a framework to achieve such a system.

### AI Summary

### AI-Generated Summary (Experimental)

This summary was generated using automated tools and was not authored or reviewed by the article's author(s). It is provided to support discovery, help readers assess relevance, and assist readers from adjacent research areas in understanding the work. It is intended to complement the author-supplied abstract, which remains the primary summary of the paper. The full article remains the authoritative version of record. [Click here to learn more](https://dl.acm.org/generative-ai/summarizations "Learn more about ACM AI summaries").

Click here to comment on the accuracy, clarity, and usefulness of this summary. Doing so will help inform refinements and future regenerated versions.

To view this AI-generated plain language summary, you must have Premium access.

## 1 Introduction

Virtual prototyping has been increasingly used in the apparel industry since COVID-19. The 3D digital garment fit evaluation process assesses the fit and performance of garments in a virtual environment, bypassing the need for multiple physical prototypes \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001)\]. Once the digital garment is created on an avatar, the fit evaluation process involves simulating various conditions to analyze how the garment behaves and fits on the virtual body. This includes assessing parameters such as fabric drape, tension, and pressure points. Advanced simulation algorithms calculate these factors, providing visual feedback on the areas of tightness, looseness, and overall garment fit. Additionally, the software can simulate different body movements and postures to evaluate dynamic fit. The results from these simulations are carefully analyzed, allowing designers to identify and address any fit issues, optimize the garment pattern, and predict the final product's performance with high accuracy. However, it should be noted that the accuracy of 3D virtual prototyping depends on the quality of input data, such as precise body measurements and detailed fabric properties. Any inaccuracies or inconsistencies in this data can compromise the reliability of the virtual prototypes, leading to potential fit issues and design errors in the final product. Although 3D virtual prototyping software has advanced significantly in recent years, replicating complex fabric behaviors, such as stretch, drape, and interaction with different body types, can still be challenging \[ [2](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0002)\]. These inaccuracies can lead to discrepancies between the virtual prototype and the final physical garment, requiring additional adjustments and physical prototypes.

The rapid advancement of machine learning (ML) technologies has significantly transformed various industries, including fashion design and garment production (use existing citations). However, to fully harness the potential of ML models in improving garment fit and design, it is important to incorporate feedback from technical design teams. Integrating this expert feedback into ML models can enhance the accuracy and reliability of predictions, leading to better-designed garments and a more efficient design process. Despite the capabilities of existing 3D virtual prototyping programs, they often fall short of realistically replicating actual garments. By aligning ML model development with the practical knowledge of technical design teams, predictive algorithms can be designed to drive 3D prototyping tools. Therefore, in this study, we propose a framework for a classification system for fit conditions. Our approach involves incorporating detailed feedback from technical design teams into the machine learning models, ensuring that input variables such as ease, garment pressure, and output variables related to fit are consistently and accurately represented. By doing so, we aim to enhance the capabilities of existing 3D virtual prototyping programs and provide a robust foundation for future advancements in AI-driven fashion design and production.

## 2 Background

### 2.1 Overview of the 3D digital garment fit evaluation process

In apparel product development, a basic block, a flat pattern of a simple style with no seam allowance, is engineered in millimeter precision to provide proper garment fit \[ [3](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0003)\]. A block pattern defines the fit for any derived style \[ [4](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0004)\]. An unlimited number of garment styles (child pattern) can be generated through the manipulation of the block patterns (parent pattern) \[ [3](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0003), [5](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0005)\]. Fit sessions with live fit models are conducted to test the fit of garments made from these altered basic blocks. Fit models represent a specific target customer's size and shape. During a fit session, they try garment prototypes and provide insight into the fit and comfort of static and dynamic poses \[ [6](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0006), [7](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0007), [8](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0008)\]. A team of professionals, who include designers, technical designers, merchandisers, and product development managers, determine alterations to style, fit, and material during fit sessions. The team evaluates visual clues of misfit related to fabric grain, set, line, ease (the gap between garment and body), and balance \[ [9](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0009)\], as well as the fit model's feedback, and suggests specific pattern alterations by marking the prototype and taking measurements \[ [3](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0003), [10](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0010)\]. The feedback data on comfort and the final look is associated with the suggested changes to the patterns’ key points. Physical prototypes are prepared for the next fit testing for each pattern alteration suggested. An average garment prototype goes through at least two to three fit sessions until a satisfactory fit is achieved \[ [11](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0011)\].

In recent years, especially after COVID-19, fit session teams have been increasingly using 2D/3D virtual prototyping Computer-Aided Design (CAD) programs as they are becoming more convenient than traditional methods. Initially, these technologies could only display the appearance of clothes without accurately replicating fabric texture, draping effects, and other critical factors. However, CAD programs such as Clo3D, Optitex, Lectra, and Browzwear are much improved, allowing designers to create prototypes, make adjustments, select fabrics, and evaluate virtual clothing designs on 3D human body images.

Earlier studies that examined the accuracy of virtual fit simulations reported adequate accuracy for overall fit simulations but highlighted issues with simulating detailed fit indicators \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001), [12](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0012), [13](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0013)\]. Researchers also noted higher inaccuracies in fit simulations at certain body parts \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001), [12](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0012)\] and lower simulation accuracy for poorly fitting garments \[ [12](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0012)\]. Recent studies report some improvements. For instance, \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001)\] reported that 3D virtual fit simulation technology can provide detailed visualizations of a garment's shape and identify major issues related to length, width, and shape early in the prototyping process. It also allows for assessing garment tightness, looseness, length, and seamlines, facilitating the recognition of alignment and positioning issues \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001)\]. Some scholars suggested using a 3D body scan avatar to enhance the accuracy of 3D fit simulation \[ [14](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0014)\]. Others utilized garment ease and sensory descriptors to model the relationship between them and to estimate the fit perception of a specific garment size independent of physical try-on \[ [15](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0015)\]. However, the challenge of fidelity remains \[ [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0001)\]. Such shortcomings could result in detecting fewer fit issues in virtual garments, which may jeopardize the trust in virtual prototyping in new product development. Studies to improve digital fabric drapes \[ [16](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0016)\], and garment pressure \[ [17](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0017)\] are ongoing, and there are also developments in making avatars (i.e., digital fit models) close to humans by using soft avatars \[ [18](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0018), [19](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0019)\]. Therefore, achieving high reliability from these software programs necessitates additional time and development efforts.

In 3D apparel CAD programs, several tools are provided to overcome the visual shortcomings of the virtual prototypes. They vary and are named differently in different software programs. The common ones include stress and strain maps and pressure maps. Technical designers typically sought help from these tools to assess avatar-digital garment relationships to make implications on virtual garment fit, predict actual garment fit, and act on modifying 2D patterns. Garment pressure is a good indicator of clothing fit and comfort and signals information about ease. This factor can be measured objectively in 3D programs through pressure maps. These maps display varying levels of garment pressure through a color gradient ranging from blue to red, with corresponding numeric values from 0 to 10 kPa. However, similar to the fabric drape, this tool is yet to be improved to be reliable. For example, after using the pressure map tool and comparing it to the actual garment pressure values, Kim and Baytar \[ [20](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0020)\] reported significantly higher digital dynamic pressure than the actual dynamic pressure among females wearing compression tops. Another study compared the absolute pressure values applied by whole-body compression garments to virtual pressures from heat maps and found no clear correlations between the virtual and real pressures, highlighting issues in the virtual fit process \[ [17](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0017)\]. In contrast, Sayem and Bednall \[ [21](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0021)\] discovered that heat maps could effectively predict the drape of woven sleeveless shirts with positive ease. These studies highlight the need for optimizing digital fit evaluation.

### 2.2 AI in the apparel design

The apparel industry is known for its dynamism and fast-paced nature. It constantly seeks ways to enhance the design process and produce well-fitting, comfortable garments to increase sales and customer loyalty. Driven by ever-changing trends and consumer preferences, the industry has begun leveraging AI to improve its operations. AI applications span from design and production to sales and marketing, with the potential to revolutionize the industry in numerous ways. Specifically, they address decision-making challenges in pattern design \[ [22](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0022), [23](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0023)\], manufacturing \[ [24](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0024)\], retailing \[ [25](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0025), [26](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0026), [27](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0027)\], and supply chain management \[ [26](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0026)\].

As for product development, AI systems can automatically generate effective solutions for garment fit through supporting fit evaluations \[ [23](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0023), [28](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0028), [29](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0029), [30](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0030), [31](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0031), [32](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0032), [33](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0033)\]. Traditionally, garment fit evaluation is a subjective process. Technical designers analyze visual fit clues and ask questions to fit models related to garment fit and comfort. AI and 3D digital prototypes can make the design and fitting process more data-driven and less reliant on subjective human judgment. AI can provide real-time feedback and suggestions, predict fit issues, and offer solutions to improve garment design, while 3D prototypes provide a visual representation of the garment on a virtual model.

Several studies have integrated Machine Learning (ML) models to predict 3D garment fit based on input variables, including ease, digital garment pressure, and their combinations \[ [23](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0023), [29](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0029), [31](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0031), [32](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0032), [33](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0033)\]. Each study followed a different approach to classifying fit; some of them examined overall fit in a binary mode (good or bad) \[ [33](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0033)\], while others classified fit into three categories (e.g., tight, fit, or loose) \[ [30](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0030), [32](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0032)\]. Additionally, some studies classified fit at different body parts (e.g., waist, hip, crotch, leg) \[ [29](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0029)\]. These studies employed different ML classification models to predict 3D garment fit, including Naïve Bayes (NB), Support Vector Machine (SVM), Bayesian classifier (BC), Random Forest (RF), Back-Propagation Neural Network (BP-NN), and Logistic Regression (LR). However, the input variables and results varied; the highest prediction accuracy reported was 97.67%, achieved by a Probabilistic Neural Network (PNN) model using both ease and digital garment pressure as input variables \[ [32](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0032)\].

Most of these studies used parametric avatars for measuring garment pressure. Additionally, they evaluated garment fit solely from the customer's perspective without incorporating the fit criteria from a professional team's point of view \[ [4](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0004)\]. Therefore, to improve ML models, there is a need to incorporate feedback from the technical design team related to input variables (i.e., ease, digital garment pressure, or a combination of both) and output variables (fit or misfit; tight, loose, and good fit; localized fit, or detailed overall fit status) consistently across different ML classification models. This approach can offer an improvement to the existing 3D virtual prototyping programs.

## 3 Proposed Method

Fit assessments in apparel product development are cyclical decision-making processes among the experts. Fit models that participate in fit sessions run repetitive fit assessments over several products until the fit issues are resolved. Resolving fit issues can be a complex process in some cases, as a fit issue in one area of the garment may be connected to another area.

This study proposes a method of coding fit session data that can be used in an AI algorithm (Figure [1](https://dl.acm.org/doi/full/10.1145/3688671.3688795#fig1)). Adopting the ‘team mental model, and Actor-Network Theory (ANT) \[ [34](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0034)\], interactions among the human (designer and fit model) and non-human (garment pattern) actors, i.e., fit session data can be recorded, accumulated and used by AI as a starting point. In the proposed method, a feedback loop would be created to continue iterations until a good fit is obtained. Before any fit alteration, extracting the pattern key points in xi and yi coordinates is important. Following each alteration, the corresponding point coordinates for each block pattern should be modified. To record the new point coordinates, any programming language can draw the schematic geometry of the pattern and calculate the new point coordinates. The result obtained from a good fit can provide valuable information about the ease amount at each local area (i.e., Ease waist = Garment measurement waist – body measurement waist). In addition, as explored by \[ [29](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0029)\], it is important to codify and record the fit status at each body landmark (i.e., waist, hip, thigh, and knee levels) and then record the overall fit obtained in a fit session from the technical team. The fit model can provide feedback based on a pre-designed questionnaire by trying on the prototype. Then technical designers can evaluate the fit based on a predefined checklist and fix the issue. The fit status obtained from physical fit sessions can be used as output data for each ML model. Using a 3D body scanner, each fit model's 3D body image can be created and imported into a 3D simulation software. Using the data obtained from the good and bad fit of garments, patterns can be simulated on the 3D scans of the fit models. Next, garment pressure can be measured digitally for each fit at different body landmarks. This information and the garment ease would be input data for each ML prediction model.

![](https://dl.acm.org/cms/10.1145/3688671.3688795/asset/095dcf6e-5ca3-4242-8bd8-f013ab23acf5/assets/images/medium/image1.jpg)

A framework for recording fit sessions and creating a feedback loop with AI

A diagram of a data collection Description automatically generated

## 4 Discussion

AI and 3D digital prototypes offer an objective and efficient approach to fashion design by leveraging advanced technologies to analyze and visualize garment patterns. They capture valuable data about how different designs perform, how changes in patterns affect the fit, and how designers and fit models respond to these changes. This documentation can be used to refine the design process, improve garment quality, and enhance the overall efficiency of the fashion industry. To our knowledge, only a few studies were conducted to analyze the effectiveness of input and output variables in predicting 3D garment fit. Understanding the effect of input variables, such as ease, digital garment pressure, and a combination of both, would greatly assist in reducing the number of physical fit sessions required and contributing to a comprehensive data library for future use. The application of AI in apparel product development offers significant improvements in decision-making by transforming existing knowledge into new insights. AI systems can assist technical designers \[ [35](https://dl.acm.org/doi/full/10.1145/3688671.3688795#Bib0035)\]. Our proposed study aims to rectify the limitation of 3D garment fit evaluation, making it a timely and crucial contribution to the integration of AI in the fashion industry's product development.

## 5 Conclusion

Addressing the identified gaps in apparel product development and AI, our proposed study proposed a method for recording fit session data with ease and pressure measurement and using them to make pattern modifications to improve garment fit. It is necessary to learn from the fit session data during the product development process and record and track any information required for obtaining a good fit, particularly from the technical designers’ point of view. The next step would be integrating this knowledge into 3D fit simulation software to establish real and virtual fitting correlations. This integration will facilitate the development of a digital system that can aid designers' decision-making processes and adapt to consumer needs to enhance satisfaction and loyalty through consistent quality.

## Acknowledgments

This material is based upon work supported by the National Science Foundation under Grant NO. 2048022. Any opinions, findings, and conclusions, or recommendations expressed in this material are those of the authors and do not necessarily reflect the views of the National Science Foundation.

## References

\[1\]

Eunyoung Lee and Huiju Park. 2016. 3D Virtual fit simulation technology: strengths and areas of improvement for increased industry adoption. International Journal of Fashion Design, Technology and Education 10, 1 (June 2016), 59–70.

[Crossref](https://doi.org/10.1080/17543266.2016.1194483)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1080%2F17543266.2016.1194483)

\[2\]

Susan P. Ashdown and Elizabeth K. O'Connell. 2006. Comparison of Test Protocols for Judging the Fit of Mature Women's Apparel. Clothing and Textiles Research Journal 24, 2 (March 2006), 137–146.

[Crossref](https://doi.org/10.1177/0887302X0602400207)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0887302X0602400207)

\[3\]

Elizabeth K Bye and Karen L LaBat. 2005. An analysis of apparel industry fit sessions. Journal of textile and apparel technology and management 4, 3 (March 2005), 1–5.

[Google Scholar](https://scholar.google.com/scholar?q=Elizabeth+K+Bye+and+Karen+L+LaBat.+2005.+An+analysis+of+apparel+industry+fit+sessions.+Journal+of+textile+and+apparel+technology+and+management+4%2C+3+%28March+2005%29%2C+1%E2%80%935.)

\[4\]

Hwa Kyung Song and Susan P. Ashdown. 2015. Investigation of the Validity of 3-D Virtual Fitting for Pants. Clothing and Textiles Research Journal 33, 4 (June 2015), 314–330.

[Crossref](https://doi.org/10.1177/0887302X15592472)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0887302X15592472)

\[5\]

Dong-Eun Kim and Karen LaBat. 2012. An exploratory study of users’ evaluations of the accuracy and fidelity of a three-dimensional garment simulation. Textile Research Journal 83, 2 (September 2012), 171–184.

[Crossref](https://doi.org/10.1177/0040517512458339)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0040517512458339)

\[6\]

Young-Ran Nam and Dong-Eun Kim. 2021. A Study on the Comparison of 3D Virtual Clothing and Real Clothing by Neckline Type. Fashion & Textile Research Journal 23, 2 (April 2021), 247–260.

[Crossref](https://doi.org/10.5805/SFTI.2021.23.2.247)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.5805%2FSFTI.2021.23.2.247)

\[7\]

Xuyuan Tao, Xiao Chen, Xianyi Zeng, and Ludovic Koehl. 2018. A customized garment collaborative design process by using virtual reality and sensory evaluation on garment fit. Computers & Industrial Engineering 115, (January 2018), 683–695.

[Digital Library](https://dl.acm.org/doi/10.1016/j.cie.2017.10.023)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.cie.2017.10.023)

\[8\]

Jong Kyu Lee and Ho Sun Lim. 2023. Movement, Wear Comfort, and Compression Evaluation of Nylon and Polyurethane Blend Stretch Knit Material and 3D Virtual Fitting Stress Strain Comparison. Fibers and Polymers 24, 7 (June 2023), 2541–2555.

[Crossref](https://doi.org/10.1007/s12221-023-00246-0)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1007%2Fs12221-023-00246-0)

\[9\]

Kristina Brubacher, David Tyler, Phoebe Apeagyei, Prabhuraj Venkatraman, and Andrew Mark Brownridge. 2021. Evaluation of the Accuracy and Practicability of Predicting Compression Garment Pressure Using Virtual Fit Technology. Clothing and Textiles Research Journal (March 2021), 0887302X2199931.

[Crossref](https://doi.org/10.1177/0887302x21999314)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0887302x21999314)

\[10\]

Darcy HARRISON, Ye FAN, Egor LARIONOV, and Dinesh K PAI. 2018. Fitting Close-to-Body Garments with 3D Soft Body Avatars. (October 2018).

[Crossref](https://doi.org/10.15221/18.184)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.15221%2F18.184)

\[11\]

Cristian Romero, Miguel A Otaduy, Dan Casas, and Jesus Perez. 2020. Modeling and Estimation of Nonlinear Skin Mechanics for Animated Avatars. Computer Graphics Forum 39, 2 (May 2020), 77–88.

[Crossref](https://doi.org/10.1111/cgf.13913)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1111%2Fcgf.13913)

\[12\]

Emma SCOTT, Simeon GILL, Susan ASHDOWN, and Gerald RUDERMAN. 2022. Apparel Fit Language Suited to 3D Body Processing Ecosystems. (October 2022).

[Crossref](https://doi.org/10.15221/22.41)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.15221%2F22.41)

\[13\]

Youngsook Kim and Fatma Baytar. 2024. Accuracy and feasibility of 3D virtual dynamic fit technology. International journal of clothing science and technology (April 2024).

[Crossref](https://doi.org/10.1108/IJCST-12-2023-0182)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1108%2FIJCST-12-2023-0182)

\[14\]

AS Muhammad Sayem and A Bednall. 2017. A Novel Approach to Fit Analysis of Virtual Fashion Clothing. (March 2017).

[Google Scholar](https://scholar.google.com/scholar?q=AS+Muhammad+Sayem+and+A+Bednall.+2017.+A+Novel+Approach+to+Fit+Analysis+of+Virtual+Fashion+Clothing.+%28March+2017%29.)

\[15\]

Yuanjing Huang, Hong Shen, Yuyuan Shi, Wenjing Yang, Wei Wang, Ruyu Wan, and Linzi Dodd. 2024. Artificial intelligence-based precise prediction of anthropometric data for female garment pattern-making. The journal of the Textile Institute/Journal of the Textile Institute (May 2024), 1–9.

[Crossref](https://doi.org/10.1080/00405000.2024.2352183)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1080%2F00405000.2024.2352183)

\[16\]

Kaixuan Liu, Xianyi Zeng, Pascal Bruniaux, Xuyuan Tao, Xiaofeng Yao, Victoria Li, and Jianping Wang. 2018. 3D interactive garment pattern-making technology. Computer-Aided Design 104, (November 2018), 113–124.

[Digital Library](https://dl.acm.org/doi/10.1016/j.cad.2018.07.003)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.cad.2018.07.003)

\[17\]

Yanni Xu. 2018. Artificial Intelligence for Fashion Industry in the Big Data Era. Springer Singapore, Singapore.

[Crossref](https://doi.org/10.1007/978-981-13-0080-6)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1007%2F978-981-13-0080-6)

\[18\]

Chandadevi Giri, Sheenam Jain, Xianyi Zeng, and Pascal Bruniaux. 2019. A Detailed Review of Artificial Intelligence Applied in the Fashion and Apparel Industry. IEEE Access 7, (2019), 95376–95396.

[Crossref](https://doi.org/10.1109/ACCESS.2019.2928979)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1109%2FACCESS.2019.2928979)

\[19\]

M. Pereira, J. Antão B. Moura, Evandro De B. Costa, Thales Vieira, André R. D. B. Landim, Eirini Bazaki, and Vanissa Wanick. 2022. Customer models for artificial intelligence-based decision support in fashion online retail supply chains. Decision Support Systems 158, 113795 (April 2022), 113795.

[Digital Library](https://dl.acm.org/doi/10.1016/j.dss.2022.113795)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.dss.2022.113795)

\[20\]

Radhika Pillarisetty and Pratika Mishra. 2022. A Review of AI (Artificial Intelligence) Tools and Customer Experience in Online Fashion Retail. International Journal of E-Business Research 18, 2 (April 2022).

[Digital Library](https://dl.acm.org/doi/10.4018/IJEBR.294111)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.4018%2FIJEBR.294111)

\[21\]

Y CHEN, X ZENG, M. HAPPIETTE, P. BRUNIAUX, R NG, and W YU. 2004. ESTIMATION OF EASE ALLOWANCE OF A GARMENT USING FUZZY LOGIC. (August 2004).

[Crossref](https://doi.org/10.1142/9789812702661_0095)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1142%2F9789812702661_0095)

\[22\]

Kaixuan Liu, R L Wang, X Y Hao, Chun Zhu, Z Zhou, Xianyi Zeng, Xuyuan Tao, Pascal Bruniaux, and J P Wang. 2023. Garment fit evaluation using neural networks technology. The journal of the Textile Institute/Journal of the Textile Institute 115, 4 (April 2023), 562–572.

[Crossref](https://doi.org/10.1080/00405000.2023.2201526)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1080%2F00405000.2023.2201526)

\[23\]

Helen Joseph Armstrong. 2010. Patternmaking for fashion design. Pearson Education, Upper Saddle River, N. J.; Harlow.

[Google Scholar](https://scholar.google.com/scholar?q=Helen+Joseph+Armstrong.+2010.+Patternmaking+for+fashion+design.+Pearson+Education%2C+Upper+Saddle+River%2C+N.+J.%3B+Harlow.)

\[24\]

Kaixuan Liu, Hanhan Wu, Chun Zhu, Jianping Wang, Xianyi Zeng, Xuyuan Tao, and Pascal Bruniaux. 2022. An evaluation of garment fit to improve customer body fit of fashion design clothing. The International Journal of Advanced Manufacturing Technology 120, 3-4 (February 2022), 2685–2699.

[Crossref](https://doi.org/10.1007/s00170-022-08965-z)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1007%2Fs00170-022-08965-z)

\[25\]

Evrim Buyukaslan Oosterom, Fatma Baytar, Deniz Akdemir, and Fatma Kalaoglu. 2024. Predicting consumers’ garment fit satisfactions by using machine learning. Autex Research Journal 24, 1 (January 2024).

[Crossref](https://doi.org/10.1515/aut-2023-0016)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1515%2Faut-2023-0016)

\[26\]

Zhujun Wang, Jianping Wang, Xianyi Zeng, Shukla Sharma, Yingmei Xing, Shuo Xu, and Li Liu. 2021. Prediction of garment fit level in 3D virtual environment based on artificial neural networks. Textile Research Journal 91, 15-16 (January 2021), 1713–1731.

[Crossref](https://doi.org/10.1177/0040517520987520)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0040517520987520)

\[27\]

Kaixuan Liu, Xianyi Zeng, Pascal Bruniaux, Jianping Wang, Edwin Kamalha, and Xuyuan Tao. 2017. Fit evaluation of virtual garment try-on by learning from digital pressure data. Knowledge-Based Systems 133, (October 2017), 174–182.

[Digital Library](https://dl.acm.org/doi/10.1016/j.knosys.2017.07.007)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.knosys.2017.07.007)

\[28\]

Bruno Latour. 2005. Reassembling the Social : an Introduction to Actor-Network-Theory. Oxford University Press, Oxford.

[Crossref](https://doi.org/10.1093/oso/9780199256044.001.0001)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1093%2Foso%2F9780199256044.001.0001)

\[29\]

Mona Maher and Fatma Baytar. 2024. Supporting Technical Designers’ Decision-Making in the Era of Artificial Intelligence. (January 2024).

[Crossref](https://doi.org/10.31274/itaa.17310)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.31274%2Fitaa.17310)

\[30\]

Emma C Scott, Simeon Gill, and Carol McDonald. 2019. Novel Methods to Drive Pattern Engineering through and for Enhanced Use of 3D Technologies. Proceedings of 3DBODY.TECH 2019 - 10th International Conference and Exhibition on 3D Body Scanning and Processing Technologies, Lugano, Switzerland, 22-23 Oct. 2019 (October 2019).

[Crossref](https://doi.org/10.15221/19.211)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.15221%2F19.211)

\[31\]

H. Q. Huang, P. Y. Mok, Y. L. Kwok, and J. S. Au. 2012. Block pattern generation: From parameterizing human bodies to fit feature-aligned and flattenable 3D garments. Computers in Industry 63, 7 (September 2012), 680–691.

[Digital Library](https://dl.acm.org/doi/10.1016/j.compind.2012.04.001)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1016%2Fj.compind.2012.04.001)

\[32\]

Susan P. Ashdown. 1998. An investigation of the structure of sizing systems. International Journal of Clothing Science and Technology 10, 5 (December 1998), 324–341.

[Crossref](https://doi.org/10.1108/09556229810239324)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1108%2F09556229810239324)

\[33\]

Evridiki PAPACHRISTOU. 2015. How to integrate recent development in technology with Digital Prototype textile and apparel applications. MARMARA UNIVERSITY JOURNAL OF SCIENCE 27, 3 (2015).

[Crossref](https://doi.org/10.7240/mufbed.96632)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.7240%2Fmufbed.96632)

\[34\]

Hwa Kyung Song and Susan P. Ashdown. 2010. An Exploratory Study of the Validity of Visual Fit Assessment From Three-Dimensional Scans. Clothing and Textiles Research Journal 28, 4 (September 2010), 263–278.

[Crossref](https://doi.org/10.1177/0887302x10376411)

[Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177%2F0887302x10376411)

\[35\]

M. D. Erwin and Lila A. Kinchen. 1969. Clothing for Moderns. Semantic Scholar. Retrieved July 29, 2024 from [https://www.semanticscholar.org/paper/Clothing-for-Moderns-Erwin-Kinchen/3d05393fa72d1d271dac12f5eccc9a5cc1d514fe](https://www.semanticscholar.org/paper/Clothing-for-Moderns-Erwin-Kinchen/3d05393fa72d1d271dac12f5eccc9a5cc1d514fe)

[Google Scholar](https://scholar.google.com/scholar?q=M.+D.+Erwin+and+Lila+A.+Kinchen.+1969.+Clothing+for+Moderns.+Semantic+Scholar.+Retrieved+July+29%2C+2024+from+https%3A%2F%2Fwww.semanticscholar.org%2Fpaper%2FClothing-for-Moderns-Erwin-Kinchen%2F3d05393fa72d1d271dac12f5eccc9a5cc1d514fe)

## Cited By

[View all](https://dl.acm.org/action/ajaxShowCitedBy?doi=10.1145/3688671.3688795 "View all cited by in new tab")

- Yang HSong XJin J(2026)Digital Workflow for Fashion Innovation and Entrepreneurship TrainingProceedings of the 2nd International Conference on Artificial Intelligence, Virtual Reality and Interaction Design10.1145/3820915.3821157(1568-1575)Online publication date: 27-Mar-2026
[https://dl.acm.org/doi/10.1145/3820915.3821157](https://dl.acm.org/doi/10.1145/3820915.3821157)


## Index Terms

Index Terms (Premium feature)

1. Predicting 3D garment fit in digital product development: Selecting input variables

1. [Computing methodologies](https://dl.acm.org/doi/full/10.1145/3688671.3688795#)



      1. [Artificial intelligence](https://dl.acm.org/doi/full/10.1145/3688671.3688795#)

## Recommendations

Recommendations (Premium feature)

- [**Fit evaluation of 3D virtual garment**](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Fit evaluation of 3D virtual garment")

UI-HCII'07: Proceedings of the 2nd international conference on Usability and internationalization







Fitting in the real world can be reflected in cyber space for 3D virtual fitting simulation
technology to be used by the tool for fit estimating. This study examined objectiveness
and correctness of the information on clothing fit using 3D virtual ...







[Read More](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Read More")

- [**Fit evaluation of virtual garment try-on by learning from digital pressure data**](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Fit evaluation of virtual garment try-on by learning from digital pressure data")





A remote garment fit evaluation model using machine-learning technique is proposed
to estimate garment fit without any real try-on.Digital clothing pressures, generated
from a 3D garment CAD software, were taken into account during the remote garment
fit ...







[Read More](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Read More")

- [**Predicting ready-made garment dressing fit for individuals based on highly reliable examples**](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Predicting ready-made garment dressing fit for individuals based on highly reliable examples")



Highlights










  - Generating highly reliable body-garment paired data by digitalizing the garment on
     a shape-changing robotic mannequin with the method of physically ...

Graphical abstract


Display Omitted

Abstract


Predicting the dressing fit of a ready-made garment for different individuals is a
challenging problem in online garment sales. At present, the main solution involves
physics-based virtual garment simulation, which has limitations in ...

[Read More](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Read More")

## Comments

Comments (Premium feature)

Disqus Comments

We were unable to load Disqus. If you are a moderator please see our [troubleshooting guide](https://docs.disqus.com/help/83/).

## DL Comment Policy

Comments should be relevant to the contents of this article, (sign in required).

Got it

- [Share](https://disqus.com/embed/comments/?base=default&f=acm-prod&t_i=10.1145%2F3688671.3688795&t_u=https%3A%2F%2Fdl.acm.org%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&t_d=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&t_t=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&s_o=default#)

  - Tweet this discussion
  - Share this discussion on Facebook
  - Share this discussion via email
  - Copy link to discussion

  - [Best](https://disqus.com/embed/comments/?base=default&f=acm-prod&t_i=10.1145%2F3688671.3688795&t_u=https%3A%2F%2Fdl.acm.org%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&t_d=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&t_t=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&s_o=default#)
  - [Newest](https://disqus.com/embed/comments/?base=default&f=acm-prod&t_i=10.1145%2F3688671.3688795&t_u=https%3A%2F%2Fdl.acm.org%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&t_d=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&t_t=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&s_o=default#)
  - [Oldest](https://disqus.com/embed/comments/?base=default&f=acm-prod&t_i=10.1145%2F3688671.3688795&t_u=https%3A%2F%2Fdl.acm.org%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&t_d=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&t_t=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&s_o=default#)

Nothing in this discussion yet.

[Load more comments](https://disqus.com/embed/comments/?base=default&f=acm-prod&t_i=10.1145%2F3688671.3688795&t_u=https%3A%2F%2Fdl.acm.org%2Fdoi%2Ffull%2F10.1145%2F3688671.3688795&t_d=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&t_t=Predicting%203D%20garment%20fit%20in%20digital%20product%20development%3A%20Selecting%20input%20variables%20%7C%20Proceedings%20of%20the%2013th%20Hellenic%20Conference%20on%20Artificial%20Intelligence&s_o=default#)

### Information

#### Published In

![cover image ACM Other conferences](https://dl.acm.org/cms/asset/2cbd85f7-a012-4d03-9d74-a4100af89b8a/3688671.cover.jpg)

SETN '24: Proceedings of the 13th Hellenic Conference on Artificial Intelligence

September 2024

437 pages

ISBN:9798400709821

DOI:10.1145/3688671

Copyright © 2024 Copyright held by the owner/author(s). Publication rights licensed to ACM.

Permission to make digital or hard copies of all or part of this work for personal or classroom use is granted without fee provided that copies are not made or distributed for profit or commercial advantage and that copies bear this notice and the full citation on the first page. Copyrights for components of this work owned by others than the author(s) must be honored. Abstracting with credit is permitted. To copy otherwise, or republish, to post on servers or to redistribute to lists, requires prior specific permission and/or a fee. Request permissions from permissions@acm.org.

#### Publisher

Association for Computing Machinery

New York, NY, United States

#### Publication History

**Published**: 27 December 2024

#### Check for updates

[Check for updates on crossmark](https://dl.acm.org/doi/full/10.1145/3688671.3688795# "Check for updates on crossmark")

#### Author Tags

1. [3D simulations](https://dl.acm.org/keyword/3D+simulations?expand=all)
2. [AI](https://dl.acm.org/keyword/AI?expand=all)
3. [Garment fit evaluation](https://dl.acm.org/keyword/Garment+fit+evaluation?expand=all)
4. [New Product development](https://dl.acm.org/keyword/New+Product+development?expand=all)
5. [Technical apparel design](https://dl.acm.org/keyword/Technical+apparel+design?expand=all)

#### Qualifiers

- Research-article

#### Funding Sources

- [National Science Foundation](https://doi.org/10.13039/100000001)

#### Conference

SETN 2024

[SETN 2024: 13th Hellenic Conference on Artificial Intelligence](https://setn2024.cs.unipi.gr/)

September 11 - 13, 2024

Piraeus, Greece

### Contributors

![](https://dl.acm.org/specs/products/acm/releasedAssets/images/loader-7e60691fbe777356dc81ff6d223a82a6.gif)

#### Other Metrics

[View Article Metrics](https://dl.acm.org/doi/full/10.1145/3688671.3688795#tab-metrics-inner)

### Bibliometrics

#### Article Metrics

- 1

Total Citations
[View Citations](https://dl.acm.org/doi/full/10.1145/3688671.3688795#tab-citations)
- 804

Total Downloads


- Downloads (Last 12 months)Advanced metrics (Premium feature)...
- Downloads (Last 6 weeks) Advanced metrics (Premium feature)...

Reflects downloads up to 09 Nov 2026

#### Other Metrics

[View Author Metrics](https://dl.acm.org/doi/full/10.1145/3688671.3688795#tab-contributors)

### Citations

## Cited By

[View all](https://dl.acm.org/action/ajaxShowCitedBy?doi=10.1145/3688671.3688795 "View all cited by in new tab")

- Yang HSong XJin J(2026)Digital Workflow for Fashion Innovation and Entrepreneurship TrainingProceedings of the 2nd International Conference on Artificial Intelligence, Virtual Reality and Interaction Design10.1145/3820915.3821157(1568-1575)Online publication date: 27-Mar-2026
[https://dl.acm.org/doi/10.1145/3820915.3821157](https://dl.acm.org/doi/10.1145/3820915.3821157)


### Share

#### Share this Publication link

Copy Link

Copied!

Copying failed.

#### Share on social media

[X](https://dl.acm.org/#twitter "Share on X") [LinkedIn](https://dl.acm.org/#linkedin "Share on LinkedIn") [Reddit](https://dl.acm.org/#reddit "Share on Reddit") [Facebook](https://dl.acm.org/#facebook "Share on Facebook") [Threads](https://dl.acm.org/#threads "Share on Threads") [email](https://dl.acm.org/#email "Share on email")

#### Affiliations

![](https://dl.acm.org/pb-assets/icons/DOs/default-profile-1543932446943.svg)

MonaMaher

Cornell University, Ithaca, New York, US [mm3269@cornell.edu](mailto:mm3269@cornell.edu)

[https://orcid.org/0000-0001-9614-222X](https://orcid.org/0000-0001-9614-222X)

[View Profile](https://dl.acm.org/profile/99660569405)

![](https://dl.acm.org/pb-assets/icons/DOs/default-profile-1543932446943.svg)

FatmaBaytar

Cornell University, Ithaca, New York, US [baytar@cornell.edu](mailto:baytar@cornell.edu)

[https://orcid.org/0000-0001-6666-2902](https://orcid.org/0000-0001-6666-2902)

[View Profile](https://dl.acm.org/profile/99660570521)

[View full text](https://dl.acm.org/doi/full/10.1145/3688671.3688795) \| [Download PDF](https://dl.acm.org/doi/pdf/10.1145/3688671.3688795?download=true)

xrefBack.goTo

xrefBack.goTo

Request permissionsExpand All

Collapse

Expand Table

Show all references

SHOW ALL BOOKS

[Authors Info & Affiliations](about:blank#tab-contributors)

[View Table of Contents](https://dl.acm.org/doi/proceedings/10.1145/3688671)

Your Search Results Download Request

We are preparing your search results for download ...

We will inform you here when the file is ready.

[Download now!](https://dl.acm.org/doi/full/10.1145/3688671.3688795#)

Your Search Results Download Request

Your file of search results citations is now ready.

[Download now!](https://dl.acm.org/doi/full/10.1145/3688671.3688795#)

Your Search Results Download Request

Your search export query has expired. Please try again.

Copy link

✓

Thanks for sharing!

Find any service

[AddToAny](https://www.addtoany.com/ "Share Buttons")

[More…](https://dl.acm.org/doi/full/10.1145/3688671.3688795#addtoany "Show all")

A2A